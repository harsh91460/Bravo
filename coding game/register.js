document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = this.username.value.trim();
  const password = this.password.value.trim();
  const registerMessage = document.getElementById("registerMessage");
  registerMessage.textContent = "";
  registerMessage.style.color = ""; // reset color

  if (username.length < 3) {
    registerMessage.style.color = "#f87171";
    registerMessage.textContent = "Username must be at least 3 characters.";
    return;
  }
  if (password.length < 6) {
    registerMessage.style.color = "#f87171";
    registerMessage.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      registerMessage.style.color = "lightgreen";
      registerMessage.textContent = "Registration successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2500);
    } else {
      registerMessage.style.color = "#f87171";
      registerMessage.textContent = data.message || "Registration failed.";
    }
  } catch (error) {
    registerMessage.style.color = "#f87171";
    registerMessage.textContent = "Server error. Please try again.";
  }
});
