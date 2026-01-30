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
  console.log("🎯 submitVote called with candidateId:", candidateId);
  
  if (!votingEnabled) {
    message.textContent = "❌ Voting is currently disabled";
    message.style.color = "red";
    console.log("⚠️ Voting is not enabled");
    return;
  }

  if (!admissionNo) {
    message.textContent = "Scan your ID barcode first!";
    message.style.color = "red";
    console.log("⚠️ No admission number provided");
    return;
  }

  try {
    console.log("🔍 Checking if student exists: admission #", admissionNo);
    const studentDoc = await getDoc(doc(db, "students", admissionNo));
    
    if (!studentDoc.exists()) {
      message.textContent = "Student not registered!";
      message.style.color = "red";
      console.log("❌ Student not found in database");
      return;
    }

    const student = studentDoc.data();
    console.log("✅ Student found:", student);
    
    if (student.hasVoted) {
      message.textContent = "You have already voted!";
      message.style.color = "red";
      console.log("⚠️ Student already voted");
      // Log suspicious attempt
      await setDoc(doc(db, "suspiciousAttempts", student.admissionNo + "_" + Date.now()), {
        admissionNo: student.admissionNo,
        reason: "Duplicate vote attempt",
        timestamp: serverTimestamp()
      });
      return;
    }

    // Record vote in votes collection
    console.log("📝 Attempting to save vote to Firestore...");
    console.log("   Admission No:", student.admissionNo);
    console.log("   Candidate ID:", candidateId);
    
    const voteRef = doc(db, "votes", student.admissionNo);
    console.log("📍 Vote document reference:", voteRef.path);
    
    await setDoc(voteRef, {
      studentId: student.admissionNo,
      admissionNo: student.admissionNo,
      candidateId,
      timestamp: serverTimestamp()
    });
    
    console.log("✅ Vote document created in votes collection!");
    console.log("✅ Verifying vote was saved...");
    
    // Verify the vote was written
    const savedVote = await getDoc(voteRef);
    console.log("✅ Vote verification successful:", savedVote.data());

    // Mark student as voted
    console.log("📝 Marking student as voted...");
    await setDoc(doc(db, "students", student.admissionNo), { hasVoted: true }, { merge: true });
    
    console.log("✅ Student marked as voted!");

    message.textContent = "✅ Vote submitted successfully!";
    message.style.color = "green";
    candidatesDiv.innerHTML = "";
    console.log("✅✅ VOTE COMPLETE - Vote recorded for admission:", student.admissionNo, "Candidate ID:", candidateId, "Timestamp:", new Date().toISOString());
  } catch (error) {
    console.error("❌ Vote submission error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    message.textContent = "❌ Error submitting vote: " + error.message;
    message.style.color = "red";
  }
}

// Initialize
loadCandidates();
