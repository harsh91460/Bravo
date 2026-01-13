document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("loginMessage");
  message.textContent = "";

  try {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("username", username);
      window.location.href = "game.html"; 
    } else {
      message.textContent = "Invalid username or password.";
    }
  } catch (error) {
    message.textContent = "Server error. Please try again.";
  }
});
