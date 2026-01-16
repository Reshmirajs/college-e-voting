import { getAuth, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

/* ================= ELEMENTS ================= */
const loginBtn = document.getElementById("loginBtn");
const statusMsg = document.getElementById("statusMsg");

/* ================= LOGIN ================= */
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // ✅ STOP FORM SUBMIT

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    statusMsg.textContent = "Enter email and password";
    statusMsg.className = "status error";
    return;
  }

  statusMsg.textContent = "Logging in...";
  statusMsg.className = "status";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    statusMsg.textContent = "✅ Admin logged in";
    statusMsg.className = "status success";

    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 500);

  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Invalid credentials";
    statusMsg.className = "status error";
  }
});
