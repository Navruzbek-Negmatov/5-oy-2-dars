const socket = io()

const loginSection = document.getElementById("loginSection")
const chatContainer = document.getElementById("chatContainer")
const usernameInput = document.getElementById("usernameInput")
const joinBtn = document.getElementById("joinBtn")
const messagesContainer = document.getElementById("messagesContainer")
const messageInput = document.getElementById("messageInput")
const sendBtn = document.getElementById("sendBtn")
const onlineUsers = document.getElementById("onlineUsers")
const userInfo = document.getElementById("userInfo")
const modeBtns = document.querySelectorAll(".mode-btn")
const privateChatSelector = document.getElementById("privateChatSelector")
const privateUserSelect = document.getElementById("privateUserSelect")

let currentUser = ""
let chatMode = "group"

// Login qilish
joinBtn.addEventListener("click", joinChat)
usernameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    joinChat()
  }
})

function joinChat() {
  const username = usernameInput.value.trim()
  if (username) {
    currentUser = username
    socket.emit("user-joined", username)
    loginSection.style.display = "none"
    chatContainer.style.display = "flex"

    // Foydalanuvchi ma'lumotlarini ko'rsatish
    userInfo.innerHTML = `
            <div class="user-item current-user">
                <div class="user-status"></div>
                <span>${username}</span>
            </div>
            <small>Siz</small>
        `

    messageInput.focus()
  }
}

// Xabar yuborish
sendBtn.addEventListener("click", sendMessage)
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage()
  }
})

function sendMessage() {
  const message = messageInput.value.trim()
  if (message) {
    if (chatMode === "group") {
      socket.emit("group-message", { message })
    } else if (chatMode === "private") {
      const selectedUser = privateUserSelect.value
      if (selectedUser) {
        socket.emit("private-message", {
          to: selectedUser,
          message,
        })
      } else {
        alert("Iltimos, xabar yuborish uchun foydalanuvchini tanlang!")
        return
      }
    }
    messageInput.value = ""
  }
}

// Chat rejimini o'zgartirish
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    chatMode = btn.dataset.mode

    if (chatMode === "private") {
      privateChatSelector.style.display = "block"
      messageInput.placeholder = "Shaxsiy xabar yozing..."
    } else {
      privateChatSelector.style.display = "none"
      messageInput.placeholder = "Type your message..."
    }
  })
})

// Socket event listeners
socket.on("user-connected", (data) => {
  addSystemMessage(`${data.message}`, data.time)
})

socket.on("user-disconnected", (data) => {
  addSystemMessage(`${data.message}`, data.time)
})

socket.on("online-users", (users) => {
  updateOnlineUsers(users)
  updatePrivateUserSelect(users)
})

socket.on("group-message", (data) => {
  addMessage(data, "group")
})

socket.on("private-message", (data) => {
  const isReceived = data.from !== currentUser
  addMessage(data, "private", isReceived)
})

// Xabar qo'shish funksiyalari
function addSystemMessage(message, time) {
  const messageDiv = document.createElement("div")
  messageDiv.className = "message system"
  messageDiv.innerHTML = `
        <div>${message}</div>
        <div class="message-time">${time}</div>
    `
  messagesContainer.appendChild(messageDiv)
  scrollToBottom()
}

function addMessage(data, type, isReceived = false) {
  const messageDiv = document.createElement("div")
  let className = `message ${type}`

  if (type === "private" && isReceived) {
    className += " received"
  }

  messageDiv.className = className

  let headerText = ""
  if (type === "group") {
    headerText = data.username
  } else if (type === "private") {
    headerText = isReceived ? `${data.from} (shaxsiy)` : `Siz → ${data.to}`
  }

  messageDiv.innerHTML = `
        <div class="message-header">${headerText}</div>
        <div>${data.message}</div>
        <div class="message-time">${data.time}</div>
    `

  messagesContainer.appendChild(messageDiv)
  scrollToBottom()
}

function updateOnlineUsers(users) {
  onlineUsers.innerHTML = ""
  users.forEach((user) => {
    const userDiv = document.createElement("div")
    userDiv.className = user.username === currentUser ? "user-item current-user" : "user-item"
    userDiv.innerHTML = `
            <div class="user-status"></div>
            <span>${user.username}</span>
            ${user.username === currentUser ? "<small>(Siz)</small>" : ""}
        `
    onlineUsers.appendChild(userDiv)
  })
}

function updatePrivateUserSelect(users) {
  privateUserSelect.innerHTML = '<option value="">Foydalanuvchini tanlang...</option>'
  users.forEach((user) => {
    if (user.username !== currentUser) {
      const option = document.createElement("option")
      option.value = user.username
      option.textContent = user.username
      privateUserSelect.appendChild(option)
    }
  })
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}
