import { db } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM elements
const video = document.getElementById('video');
const admissionSpan = document.getElementById('admissionNo');
const candidatesDiv = document.getElementById('candidates');
const message = document.getElementById('message');
const studentName = document.getElementById('studentName');

let admissionNo = null;
let votingEnabled = false;

// Load student info from localStorage
const currentStudent = JSON.parse(localStorage.getItem("currentStudent") || '{}');
if (currentStudent.name) {
  admissionNo = currentStudent.admissionNo;
  admissionSpan.textContent = currentStudent.admissionNo;
  studentName.textContent = currentStudent.name;
}

// Listen to voting status
onSnapshot(doc(db, "system", "votingStatus"), (docSnap) => {
  if (docSnap.exists()) {
    votingEnabled = docSnap.data().enabled || false;
    if (!votingEnabled) {
      message.textContent = "❌ Voting is currently disabled";
      message.style.color = "red";
      candidatesDiv.innerHTML = "<p style='text-align:center; color:#999;'>Voting is not active</p>";
    } else {
      message.textContent = "";
      loadCandidates();
    }
  }
});

// 1️⃣ Load candidates from Firestore
async function loadCandidates() {
  const snap = await getDocs(collection(db, "candidates"));
  candidatesDiv.innerHTML = "";
  
  if (!votingEnabled) {
    candidatesDiv.innerHTML = "<p style='text-align:center; color:#999; padding: 20px;'>⏸️ Voting is not currently active</p>";
    return;
  }
  
  // Group candidates by position
  const grouped = {};
  snap.forEach(c => {
    const data = c.data();
    if (!grouped[data.position]) grouped[data.position] = [];
    grouped[data.position].push(data);
  });

  // Render grouped candidates
  for (const position in grouped) {
    const positionDiv = document.createElement("div");
    positionDiv.className = "position-card";
    
    const positionTitle = document.createElement("div");
    positionTitle.className = "position-title";
    positionTitle.textContent = position;
    positionDiv.appendChild(positionTitle);
    
    grouped[position].forEach(candidate => {
      const candidateDiv = document.createElement("div");
      candidateDiv.className = "candidate";
      candidateDiv.style.cursor = "pointer";
      candidateDiv.onclick = () => submitVote(candidate.candidateId);
      
      candidateDiv.innerHTML = `
        <input type="radio" name="${position}" value="${candidate.candidateId}" />
        <div class="candidate-info">
          <div class="candidate-name">${candidate.name}</div>
          <div class="candidate-details">${candidate.email}</div>
        </div>
      `;
      
      positionDiv.appendChild(candidateDiv);
    });
    
    candidatesDiv.appendChild(positionDiv);
  }
}

// 2️⃣ Scan barcode using ZXing (optional - wrapped in try-catch)
try {
  if (video && typeof ZXing !== 'undefined') {
    const codeReader = new ZXing.BrowserBarcodeReader();
    codeReader.decodeFromVideoDevice(null, video, (result, err) => {
      if (result) {
        admissionNo = result.text;
        admissionSpan.textContent = admissionNo;
        console.log("Barcode scanned:", admissionNo);
      }
    });
  }
} catch (err) {
  console.log("Barcode scanning not available:", err);
}

// 3️⃣ Submit vote
async function submitVote(candidateId) {
  if (!votingEnabled) {
    message.textContent = "❌ Voting is currently disabled";
    message.style.color = "red";
    return;
  }

  if (!admissionNo) {
    message.textContent = "Scan your ID barcode first!";
    message.style.color = "red";
    return;
  }

  try {
    const studentDoc = await getDoc(doc(db, "students", admissionNo));
    if (!studentDoc.exists()) {
      message.textContent = "Student not registered!";
      message.style.color = "red";
      return;
    }

    const student = studentDoc.data();
    if (student.hasVoted) {
      message.textContent = "You have already voted!";
      message.style.color = "red";
      // Log suspicious attempt
      await setDoc(doc(db, "suspiciousAttempts", student.admissionNo + "_" + Date.now()), {
        admissionNo: student.admissionNo,
        reason: "Duplicate vote attempt",
        timestamp: serverTimestamp()
      });
      return;
    }

    // Record vote
    await setDoc(doc(db, "votes", student.admissionNo), {
      admissionNo: student.admissionNo,
      candidateId,
      timestamp: serverTimestamp()
    });

    // Mark student as voted
    await setDoc(doc(db, "students", student.admissionNo), { hasVoted: true }, { merge: true });

    message.textContent = "✅ Vote submitted successfully!";
    message.style.color = "green";
    candidatesDiv.innerHTML = "";
    console.log("Vote recorded for:", student.admissionNo, "Candidate:", candidateId);
  } catch (error) {
    console.error("Vote submission error:", error);
    message.textContent = "❌ Error submitting vote: " + error.message;
    message.style.color = "red";
  }
}

// Initialize
loadCandidates();
