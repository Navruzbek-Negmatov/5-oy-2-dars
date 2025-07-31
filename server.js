const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// EJS ni view engine sifatida sozlash
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Static fayllar uchun middleware
app.use(express.static(path.join(__dirname, "public")))

// Onlayn foydalanuvchilar ro'yxati
const onlineUsers = new Map()
const chatRooms = new Map()

// Asosiy sahifa
app.get("/", (req, res) => {
  res.render("index", {
    title: "Real-time Chat",
    totalUsers: onlineUsers.size,
  })
})

// Test sahifasi
app.get("/test", (req, res) => {
  res.render("test", {
    title: "Test Chat",
  })
})

// Socket.io ulanishlar
io.on("connection", (socket) => {
  console.log(`Yangi ulanish: ${socket.id}`)

  // Foydalanuvchi chatga qo'shilganda
  socket.on("user-joined", (userData) => {
    console.log("Foydalanuvchi qo'shildi:", userData)

    const { username, room = "general" } = userData

    // Foydalanuvchi ma'lumotlarini saqlash
    onlineUsers.set(socket.id, {
      id: socket.id,
      username: username,
      room: room,
      joinTime: new Date(),
    })

    // Xonaga qo'shilish
    socket.join(room)

    // Xush kelibsiz xabari (darhol yuborish)
    socket.emit("welcome-message", {
      message: `Siz muvaffaqiyatli "${room}" xonasiga qo'shildingiz!`,
      time: new Date().toLocaleTimeString("uz-UZ"),
    })

    // Xonaga yangi foydalanuvchi haqida xabar (boshqalarga)
    socket.to(room).emit("user-connected", {
      username: username,
      message: `${username} chatga qo'shildi`,
      time: new Date().toLocaleTimeString("uz-UZ"),
      type: "system",
    })

    // Foydalanuvchiga onlayn foydalanuvchilar ro'yxatini yuborish
    const roomUsers = Array.from(onlineUsers.values()).filter((user) => user.room === room)
    socket.emit("online-users", roomUsers)
    socket.to(room).emit("online-users", roomUsers)

    console.log(`${username} ${room} xonasiga qo'shildi. Jami foydalanuvchilar: ${onlineUsers.size}`)
  })

  // Guruh xabari
  socket.on("send-group-message", (messageData) => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      const message = {
        id: Date.now(),
        username: user.username,
        message: messageData.message,
        time: new Date().toLocaleTimeString("uz-UZ"),
        type: "group",
        room: user.room,
      }

      // Xonadagi barcha foydalanuvchilarga xabarni yuborish
      io.to(user.room).emit("receive-group-message", message)
    }
  })

  // Shaxsiy xabar
  socket.on("send-private-message", (messageData) => {
    const sender = onlineUsers.get(socket.id)
    const receiver = Array.from(onlineUsers.values()).find(
      (user) => user.username === messageData.to && user.room === sender.room,
    )

    if (sender && receiver) {
      const message = {
        id: Date.now(),
        from: sender.username,
        to: messageData.to,
        message: messageData.message,
        time: new Date().toLocaleTimeString("uz-UZ"),
        type: "private",
      }

      // Qabul qiluvchiga xabarni yuborish
      io.to(receiver.id).emit("receive-private-message", message)

      // Jo'natuvchiga ham xabarni yuborish
      socket.emit("receive-private-message", message)
    }
  })

  // Yozayotganini ko'rsatish
  socket.on("typing-start", (data) => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      socket.to(user.room).emit("user-typing", {
        username: user.username,
        isTyping: true,
      })
    }
  })

  socket.on("typing-stop", (data) => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      socket.to(user.room).emit("user-typing", {
        username: user.username,
        isTyping: false,
      })
    }
  })

  // Foydalanuvchi uzilganda
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      // Xonadan chiqish haqida xabar
      socket.to(user.room).emit("user-disconnected", {
        username: user.username,
        message: `${user.username} chatni tark etdi`,
        time: new Date().toLocaleTimeString("uz-UZ"),
        type: "system",
      })

      // Foydalanuvchini ro'yxatdan o'chirish
      onlineUsers.delete(socket.id)

      // Yangilangan foydalanuvchilar ro'yxatini yuborish
      const roomUsers = Array.from(onlineUsers.values()).filter((u) => u.room === user.room)
      socket.to(user.room).emit("online-users", roomUsers)
    }
    console.log(`Ulanish uzildi: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlamoqda`)
  console.log(`http://localhost:${PORT} ga tashrif buyuring`)
})
