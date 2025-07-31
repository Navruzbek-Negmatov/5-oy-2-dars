// Socket.io bilan bog'lanish va event handlerlar
// Socket.io client global ravishda mavjud (script tag orqali)

// Declare the io variable before using it
const io = window.io

class SocketHandler {
  constructor() {
    // Socket.io client global ravishda mavjud
    this.socket = io()
    this.currentUser = null
    this.currentRoom = "general"
    this.isTyping = false
    this.typingTimeout = null

    console.log("SocketHandler yaratildi")
    this.initializeSocketEvents()
  }

  // Socket eventlarini sozlash
  initializeSocketEvents() {
    // Ulanish hodisalari
    this.socket.on("connect", () => {
      console.log("Serverga ulandi:", this.socket.id)
    })

    this.socket.on("disconnect", () => {
      console.log("Serverdan uzildi")
    })

    // Foydalanuvchi hodisalari
    this.socket.on("welcome-message", (data) => {
      console.log("Welcome message olindi:", data)
      this.displaySystemMessage(`✅ ${data.message}`, data.time)
    })

    this.socket.on("user-connected", (data) => {
      this.displaySystemMessage(data.message, data.time)
      this.playNotificationSound()
    })

    this.socket.on("user-disconnected", (data) => {
      this.displaySystemMessage(data.message, data.time)
    })

    this.socket.on("online-users", (users) => {
      this.updateOnlineUsers(users)
    })

    // Xabar hodisalari
    this.socket.on("receive-group-message", (message) => {
      this.displayGroupMessage(message)
      if (message.username !== this.currentUser) {
        this.playMessageSound()
      }
    })

    this.socket.on("receive-private-message", (message) => {
      this.displayPrivateMessage(message)
      if (message.from !== this.currentUser) {
        this.playMessageSound()
      }
    })

    // Yozayotganini ko'rsatish
    this.socket.on("user-typing", (data) => {
      this.showTypingIndicator(data)
    })
  }

  // Chatga qo'shilish
  joinChat(username, room = "general") {
    console.log("Chatga qo'shilmoqda:", username, room)
    this.currentUser = username
    this.currentRoom = room
    this.socket.emit("user-joined", { username, room })
  }

  // Guruh xabarini yuborish
  sendGroupMessage(message) {
    if (message.trim()) {
      this.socket.emit("send-group-message", { message: message.trim() })
    }
  }

  // Shaxsiy xabarni yuborish
  sendPrivateMessage(to, message) {
    if (message.trim() && to) {
      this.socket.emit("send-private-message", {
        to: to,
        message: message.trim(),
      })
    }
  }

  // Yozayotganini bildirish
  startTyping() {
    if (!this.isTyping) {
      this.isTyping = true
      this.socket.emit("typing-start")
    }

    // Typing timeout
    clearTimeout(this.typingTimeout)
    this.typingTimeout = setTimeout(() => {
      this.stopTyping()
    }, 3000)
  }

  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false
      this.socket.emit("typing-stop")
    }
    clearTimeout(this.typingTimeout)
  }

  // UI yangilash metodlari
  displaySystemMessage(message, time) {
    const messagesContainer = document.getElementById("messagesContainer")
    const messageDiv = document.createElement("div")
    messageDiv.className = "message system"
    messageDiv.innerHTML = `
      <div>${message}</div>
      <div class="message-time">${time}</div>
    `
    messagesContainer.appendChild(messageDiv)
    this.scrollToBottom()
  }

  displayGroupMessage(message) {
    const messagesContainer = document.getElementById("messagesContainer")
    const messageDiv = document.createElement("div")
    messageDiv.className = "message group"

    const isCurrentUser = message.username === this.currentUser
    messageDiv.innerHTML = `
      <div class="message-header">${message.username}${isCurrentUser ? " (Siz)" : ""}</div>
      <div>${this.formatMessage(message.message)}</div>
      <div class="message-time">${message.time}</div>
    `
    messagesContainer.appendChild(messageDiv)
    this.scrollToBottom()
  }

  displayPrivateMessage(message) {
    const messagesContainer = document.getElementById("messagesContainer")
    const messageDiv = document.createElement("div")
    const isReceived = message.from !== this.currentUser

    messageDiv.className = `message private ${isReceived ? "received" : ""}`

    const headerText = isReceived ? `${message.from} (shaxsiy)` : `Siz → ${message.to}`

    messageDiv.innerHTML = `
      <div class="message-header">${headerText}</div>
      <div>${this.formatMessage(message.message)}</div>
      <div class="message-time">${message.time}</div>
    `
    messagesContainer.appendChild(messageDiv)
    this.scrollToBottom()
  }

  updateOnlineUsers(users) {
    const onlineUsersContainer = document.getElementById("onlineUsers")
    const userCountElement = document.getElementById("userCount")
    const privateUserSelect = document.getElementById("privateUserSelect")

    // Foydalanuvchilar sonini yangilash
    userCountElement.textContent = users.length

    // Onlayn foydalanuvchilar ro'yxatini yangilash
    onlineUsersContainer.innerHTML = ""
    users.forEach((user) => {
      const userDiv = document.createElement("div")
      const isCurrentUser = user.username === this.currentUser
      userDiv.className = `user-item ${isCurrentUser ? "current-user" : ""}`
      userDiv.innerHTML = `
        <div class="user-status"></div>
        <span>${user.username}</span>
        ${isCurrentUser ? "<small>(Siz)</small>" : ""}
      `
      onlineUsersContainer.appendChild(userDiv)
    })

    // Shaxsiy xabar uchun foydalanuvchilar ro'yxatini yangilash
    privateUserSelect.innerHTML = '<option value="">Foydalanuvchini tanlang...</option>'
    users.forEach((user) => {
      if (user.username !== this.currentUser) {
        const option = document.createElement("option")
        option.value = user.username
        option.textContent = user.username
        privateUserSelect.appendChild(option)
      }
    })
  }

  showTypingIndicator(data) {
    const typingIndicator = document.getElementById("typingIndicator")
    const typingText = typingIndicator.querySelector(".typing-text")

    if (data.isTyping && data.username !== this.currentUser) {
      typingText.textContent = `${data.username} yozmoqda...`
      typingIndicator.style.display = "flex"

      // 3 soniyadan keyin yashirish
      setTimeout(() => {
        typingIndicator.style.display = "none"
      }, 3000)
    } else {
      typingIndicator.style.display = "none"
    }
  }

  // Yordamchi metodlar
  formatMessage(message) {
    // URL larni linkga aylantirish
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById("messagesContainer")
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  playNotificationSound() {
    // Notification sound (ixtiyoriy)
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
      )
      audio.play().catch(() => {}) // Sessiz xatolikni e'tiborsiz qoldirish
    } catch (e) {
      // Audio qo'llab-quvvatlanmasa
    }
  }

  playMessageSound() {
    // Message sound (ixtiyoriy)
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
      )
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch (e) {
      // Audio qo'llab-quvvatlanmasa
    }
  }

  // Chatni tozalash
  clearChat() {
    const messagesContainer = document.getElementById("messagesContainer")
    messagesContainer.innerHTML = ""
  }
}

// Global socket handler instance
window.socketHandler = new SocketHandler()
