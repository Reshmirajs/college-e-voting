/* ================= EMAILJS INIT ================= */
emailjs.init("EdDgqnJnaXcTfLVl8"); // your public key

/* ================= FIREBASE ================= */
import { db } from "./firebase-config.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const nameInput = document.getElementById("name");
const admInput = document.getElementById("admissionNo");
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const statusMsg = document.getElementById("statusMsg");

/* ================= SEND OTP ================= */
document.getElementById("sendOtpBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  
  const nameInput = document.getElementById("name");
  const admInput = document.getElementById("admissionNo");
  const emailInput = document.getElementById("email");
  const statusMsg = document.getElementById("statusMsg");
  
  const name = nameInput.value.trim();
  const admissionNo = admInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !admissionNo || !email) {
    statusMsg.textContent = "❌ Fill all fields";
    statusMsg.className = "status error show";
    return;
  }

  statusMsg.textContent = "⏳ Sending OTP...";
  statusMsg.className = "status show";

  try {
    // Check if student exists and has already voted
    const studentRef = doc(db, "students", admissionNo);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists() && studentSnap.data().hasVoted) {
      statusMsg.textContent = "❌ You have already voted!";
      statusMsg.className = "status error show";
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    // Save OTP to Firestore
    await setDoc(doc(db, "emailOtps", email), {
      otp,
      admissionNo,
      createdAt: serverTimestamp()
    });

    // Send email via EmailJS
    const response = await emailjs.send(
      "service_gc9ke8m",
      "template_ycvgeak",
      {
        to_email: email,
        otp: otp,
        student_name: name
      }
    );
    
    console.log("Email sent successfully:", response);
    statusMsg.textContent = "✅ OTP sent to your email!";
    statusMsg.className = "status success show";
    
    // Show OTP input field
    document.getElementById("detailsForm").classList.add("hidden");
    document.getElementById("otpForm").classList.remove("hidden");
    
  } catch (err) {
    console.error("OTP Error:", err);
    statusMsg.textContent = "❌ Failed to send OTP. Check console for details.";
    statusMsg.className = "status error show";
  }
});

/* ================= VERIFY OTP ================= */
document.getElementById("verifyOtpBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  
  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otp");
  const statusMsg = document.getElementById("statusMsg");
  const admInput = document.getElementById("admissionNo");
  const nameInput = document.getElementById("name");

  const email = emailInput.value.trim();
  const enteredOtp = otpInput.value.trim();

  if (!enteredOtp) {
    statusMsg.textContent = "❌ Enter OTP";
    statusMsg.className = "status error show";
    return;
  }

  statusMsg.textContent = "⏳ Verifying OTP...";
  statusMsg.className = "status show";

  try {
    const otpRef = doc(db, "emailOtps", email);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists() || otpSnap.data().otp !== enteredOtp) {
      statusMsg.textContent = "❌ Invalid OTP";
      statusMsg.className = "status error show";
      return;
    }

    const admissionNo = admInput.value.trim();
    const studentRef = doc(db, "students", admissionNo);
    const studentSnap = await getDoc(studentRef);

    // Block login if student has already voted
    if (studentSnap.exists() && studentSnap.data().hasVoted) {
      statusMsg.textContent = "❌ You have already voted!";
      statusMsg.className = "status error show";
      return;
    }

    // Save student info if not exists or hasn't voted
    const studentData = {
      name: nameInput.value.trim(),
      admissionNo: admissionNo,
      email
    };

    await setDoc(studentRef, {
      ...studentData,
      hasVoted: studentSnap.exists() ? studentSnap.data().hasVoted : false
    }, { merge: true });

    localStorage.setItem("currentStudent", JSON.stringify(studentData));

    statusMsg.textContent = "✅ Login successful! Redirecting...";
    statusMsg.className = "status success show";

    setTimeout(() => {
      window.location.href = "./vote.html";
    }, 1000);
    
  } catch (err) {
    console.error("Verification error:", err);
    statusMsg.textContent = "❌ Verification failed: " + err.message;
    statusMsg.className = "status error show";
  }
});
