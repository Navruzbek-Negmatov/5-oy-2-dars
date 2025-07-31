// Oddiy test uchun
console.log("JavaScript fayli yuklandi")

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM yuklandi")

  const loginForm = document.getElementById("loginForm")
  const usernameInput = document.getElementById("usernameInput")
  const loginSection = document.getElementById("loginSection")
  const chatContainer = document.getElementById("chatContainer")

  if (loginForm) {
    console.log("Login form topildi")

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      console.log("Form submit qilindi")

      const username = usernameInput.value.trim()
      console.log("Username:", username)

      if (username) {
        // Oddiy o'tish
        loginSection.style.display = "none"
        chatContainer.style.display = "flex"
        console.log("Chat containerga o'tildi")
      } else {
        alert("Iltimos username kiriting!")
      }
    })
  } else {
    console.log("Login form topilmadi!")
  }
})
