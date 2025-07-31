const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Static fayllar
app.use(express.static("public"))

// Asosiy sahifa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "simple.html"))
})

// Onlayn foydalanuvchilar
const users = new Map()

// Socket events
io.on("connection", (socket) => {
  console.log("Yangi ulanish:", socket.id)

  socket.on("join", (username) => {
    console.log(`${username} qo'shildi`)
    users.set(socket.id, username)

    // Foydalanuvchiga xush kelibsiz xabari
    socket.emit("message", {
      username: "System",
      message: `Xush kelibsiz, ${username}!`,
      time: new Date().toLocaleTimeString(),
    })

    // Boshqalarga xabar
    socket.broadcast.emit("message", {
      username: "System",
      message: `${username} chatga qo'shildi`,
      time: new Date().toLocaleTimeString(),
    })

    // Onlayn foydalanuvchilar ro'yxati
    const userList = Array.from(users.values())
    io.emit("users", userList)
  })

  socket.on("chat", (data) => {
    const username = users.get(socket.id)
    if (username) {
      io.emit("message", {
        username: username,
        message: data.message,
        time: new Date().toLocaleTimeString(),
      })
    }
  })

  socket.on("disconnect", () => {
    const username = users.get(socket.id)
    if (username) {
      users.delete(socket.id)
      socket.broadcast.emit("message", {
        username: "System",
        message: `${username} chatni tark etdi`,
        time: new Date().toLocaleTimeString(),
      })

      const userList = Array.from(users.values())
      io.emit("users", userList)
    }
  })
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlamoqda`)
})
