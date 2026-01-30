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
    statusMsg.textContent = "❌ Enter email and password";
    statusMsg.className = "status error show";
    return;
  }
  
  statusMsg.textContent = "⏳ Logging in...";
  statusMsg.className = "status show";
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    statusMsg.textContent = "✅ Admin logged in successfully";
    statusMsg.className = "status success show";
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 500);
  } catch (err) {
    console.error("Login error:", err);
    console.error("Error code:", err.code);
    
    // Provide user-friendly error messages based on error code
    let errorMessage = "";
    
    switch(err.code) {
      case "auth/wrong-password":
        errorMessage = "❌ Incorrect password";
        break;
      case "auth/user-not-found":
        errorMessage = "❌ Admin account not found";
        break;
      case "auth/invalid-email":
        errorMessage = "❌ Invalid email format";
        break;
      case "auth/too-many-requests":
        errorMessage = "❌ Too many failed attempts. Try again later";
        break;
      case "auth/invalid-credential":
        errorMessage = "❌ Incorrect email or password";
        break;
      case "auth/network-request-failed":
        errorMessage = "❌ Network error. Check your connection";
        break;
      default:
        errorMessage = "❌ Invalid credentials. Please try again";
    }
    
    statusMsg.textContent = errorMessage;
    statusMsg.className = "status error show";
  }
});