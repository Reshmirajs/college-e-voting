import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { app } from "./firebase-config.js";

/* ================= AUTH ================= */
const auth = getAuth(app);

// 🔒 Protect dashboard
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/admin.html";
  }
});

/* ================= DOM ELEMENTS ================= */
const logoutBtn = document.getElementById("logoutBtn");
const votingToggleBtn = document.getElementById("votingToggleBtn");
const votingStatusDisplay = document.getElementById("votingStatusDisplay");

const addStudentForm = document.getElementById("addStudentForm");
const studentAdmissionNo = document.getElementById("studentAdmissionNo");
const studentEmail = document.getElementById("studentEmail");

const addCandidateForm = document.getElementById("addCandidateForm");
const candidateId = document.getElementById("candidateId");
const candidateName = document.getElementById("candidateName");
const candidateEmail = document.getElementById("candidateEmail");
const candidatePosition = document.getElementById("candidatePosition");

const candidateList = document.getElementById("candidateList");
const suspiciousBody = document.querySelector("#suspiciousTable tbody");

const ctx = document.getElementById("resultsChart").getContext("2d");
let resultsChart;
let votingEnabled = false;

/* ================= VOTING TOGGLE ================= */
let currentWinner = null;

// Load voting status on page load
onSnapshot(doc(db, "system", "votingStatus"), (docSnap) => {
  if (docSnap.exists()) {
    votingEnabled = docSnap.data().enabled || false;
  } else {
    votingEnabled = false;
    setDoc(doc(db, "system", "votingStatus"), { enabled: false });
  }
  updateVotingDisplay();
});

function updateVotingDisplay() {
  if (votingEnabled) {
    votingToggleBtn.textContent = "🔴 Stop Voting";
    votingToggleBtn.style.background = "linear-gradient(135deg, #d4a5a5 0%, #c99090 100%)";
    votingStatusDisplay.textContent = "✅ Voting is ACTIVE";
    votingStatusDisplay.style.color = "#4caf50";
    document.getElementById("winnerSection").style.display = "none";
  } else {
    votingToggleBtn.textContent = "🟢 Start Voting";
    votingToggleBtn.style.background = "linear-gradient(135deg, #b8c8b4 0%, #a8bca4 100%)";
    votingStatusDisplay.textContent = "❌ Voting is INACTIVE";
    votingStatusDisplay.style.color = "#ff6b6b";
    if (currentWinner) {
      document.getElementById("winnerSection").style.display = "block";
    }
  }
}

votingToggleBtn.addEventListener("click", async () => {
  try {
    if (!votingEnabled) {
      // Starting voting - reset all votes and hasVoted flags
      votingEnabled = true;
      
      // Reset all students' hasVoted flag
      const studentsSnap = await getDocs(collection(db, "students"));
      const resetPromises = [];
      studentsSnap.forEach(student => {
        resetPromises.push(setDoc(doc(db, "students", student.id), { hasVoted: false }, { merge: true }));
      });
      await Promise.all(resetPromises);
      
      // Clear votes collection
      const votesSnap = await getDocs(collection(db, "votes"));
      const deletePromises = [];
      votesSnap.forEach(vote => {
        deletePromises.push(deleteDoc(doc(db, "votes", vote.id)));
      });
      await Promise.all(deletePromises);
      
      console.log("✅ Voting session started - All votes reset");
    } else {
      // Stopping voting - calculate winner
      votingEnabled = false;
      calculateWinner();
    }
    
    await setDoc(doc(db, "system", "votingStatus"), { enabled: votingEnabled });
  } catch (err) {
    console.error("Error toggling voting:", err);
    alert("Failed to toggle voting status");
  }
});

// Function to calculate winner
async function calculateWinner() {
  try {
    const votesSnap = await getDocs(collection(db, "votes"));
    const candidatesSnap = await getDocs(collection(db, "candidates"));
    
    const voteCount = {};
    let maxVotes = 0;
    
    votesSnap.forEach(vote => {
      const candidateId = vote.data().candidateId;
      voteCount[candidateId] = (voteCount[candidateId] || 0) + 1;
      maxVotes = Math.max(maxVotes, voteCount[candidateId]);
    });
    
    let winner = null;
    candidatesSnap.forEach(candidate => {
      const data = candidate.data();
      if (voteCount[data.candidateId] === maxVotes && maxVotes > 0) {
        winner = data;
      }
    });
    
    if (winner) {
      currentWinner = winner;
      displayWinner(winner, maxVotes);
      console.log("🎉 Winner:", winner.name);
    } else {
      currentWinner = null;
      console.log("No votes received");
    }
  } catch (err) {
    console.error("Error calculating winner:", err);
  }
}

// Function to display winner
function displayWinner(winner, votes) {
  const winnerSection = document.getElementById("winnerSection");
  winnerSection.innerHTML = `
    <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 18px; border: 2px solid #667eea; margin: 30px 0; animation: slideUp 0.6s ease;">
      <div style="font-size: 64px; margin-bottom: 20px;">🏆</div>
      <h2 style="color: #667eea; font-size: 28px; margin-bottom: 10px; font-weight: 700;">ELECTION WINNER</h2>
      <h3 style="color: #333; font-size: 36px; margin-bottom: 10px; font-weight: 700;">${winner.name}</h3>
      <p style="color: #667eea; font-size: 18px; margin-bottom: 25px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${winner.position}</p>
      <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);">
        <p style="color: #5a5a5a; font-size: 16px; margin: 0; font-weight: 500;">
          Total Votes Received: <span style="color: #667eea; font-size: 28px; font-weight: 700;">${votes}</span>
        </p>
      </div>
    </div>
  `;
  winnerSection.style.display = "block";
}

/* ================= LOGOUT ================= */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/admin.html";
});

/* ================= ADD STUDENT ================= */
addStudentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await setDoc(doc(db, "students", studentAdmissionNo.value), {
    admissionNo: studentAdmissionNo.value,
    email: studentEmail.value,
    hasVoted: false,
    createdAt: serverTimestamp()
  });

  alert("Student added successfully");
  addStudentForm.reset();
});

/* ================= ADD CANDIDATE ================= */
addCandidateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await setDoc(doc(db, "candidates", candidateId.value), {
    candidateId: candidateId.value,
    name: candidateName.value,
    email: candidateEmail.value,
    position: candidatePosition.value,
    createdAt: serverTimestamp()
  });

  alert("Candidate added successfully");
  addCandidateForm.reset();
});

/* ================= CANDIDATE LIST (LIVE) ================= */
onSnapshot(collection(db, "candidates"), (snap) => {
  candidateList.innerHTML = "";

  const grouped = {};
  snap.forEach(docSnap => {
    const c = docSnap.data();
    if (!grouped[c.position]) grouped[c.position] = [];
    grouped[c.position].push({ id: docSnap.id, ...c });
  });

  for (const position in grouped) {
    const box = document.createElement("div");
    box.style.marginBottom = "20px";
    box.innerHTML = `<h4 style="color:#1976d2">${position}</h4>`;

    grouped[position].forEach(c => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "8px";
      row.style.borderBottom = "1px solid #ddd";

      row.innerHTML = `
        <span>${c.name} (${c.candidateId})</span>
        <button style="background:#ff5252; color:white; border:none; border-radius:6px; padding:6px 10px;">Delete</button>
      `;

      row.querySelector("button").addEventListener("click", async () => {
        if (confirm("Delete candidate?")) {
          await deleteDoc(doc(db, "candidates", c.id));
        }
      });

      box.appendChild(row);
    });

    candidateList.appendChild(box);
  }
});

/* ================= SUSPICIOUS ATTEMPTS ================= */
async function loadSuspicious() {
  suspiciousBody.innerHTML = "";
  const snap = await getDocs(collection(db, "suspiciousAttempts"));

  snap.forEach(s => {
    const d = s.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.admissionNo}</td>
      <td>${d.reason}</td>
      <td>${d.timestamp?.toDate().toLocaleString() || ""}</td>
    `;
    suspiciousBody.appendChild(tr);
  });
}

loadSuspicious();

/* ================= LIVE RESULTS GRAPH ================= */
let allCandidatesMap = {};

// First load all candidates
async function initCandidatesMap() {
  try {
    const candidatesSnap = await getDocs(collection(db, "candidates"));
    allCandidatesMap = {};
    candidatesSnap.forEach(c => {
      const data = c.data();
      allCandidatesMap[data.candidateId] = {
        name: data.name,
        position: data.position,
        count: 0
      };
    });
    console.log("✅ Candidates loaded:", allCandidatesMap);
    updateChart();
  } catch (err) {
    console.error("Error loading candidates:", err);
  }
}

// Initialize candidates on page load
initCandidatesMap();

// Listen to candidates collection for updates
onSnapshot(collection(db, "candidates"), (candidatesSnap) => {
  allCandidatesMap = {};
  candidatesSnap.forEach(c => {
    const data = c.data();
    allCandidatesMap[data.candidateId] = {
      name: data.name,
      position: data.position,
      count: 0
    };
  });
  console.log("📋 Candidates updated:", allCandidatesMap);
  // Don't update chart here, let votes listener handle it
});

// Listen to votes collection in real-time - THIS TRIGGERS CHART UPDATES
onSnapshot(collection(db, "votes"), (votesSnap) => {
  console.log("🔄 Vote listener triggered - Total votes:", votesSnap.size);
  
  // Reset counts
  for (const candidateId in allCandidatesMap) {
    allCandidatesMap[candidateId].count = 0;
  }

  // Count votes for each candidate
  votesSnap.forEach(voteDoc => {
    const voteData = voteDoc.data();
    const candidateId = voteData.candidateId;
    console.log("Processing vote for candidate:", candidateId);
    if (allCandidatesMap[candidateId]) {
      allCandidatesMap[candidateId].count++;
    } else {
      console.warn("Candidate not found:", candidateId);
    }
  });

  console.log("📊 Vote counts:", allCandidatesMap);
  updateChart();
});

// Function to update chart
function updateChart() {
  console.log("🎨 Updating chart...");
  const labels = [];
  const data = [];
  const colors = [];
  const palette = ["#c8d4c4", "#d4a5a5", "#b8c8b4", "#d4c4b0", "#b8a89f", "#c9b5a8", "#b5c9c4"];

  let colorIndex = 0;
  for (const candidateId in allCandidatesMap) {
    const candidate = allCandidatesMap[candidateId];
    labels.push(`${candidate.name}\n(${candidate.position})`);
    data.push(candidate.count);
    colors.push(palette[colorIndex++ % palette.length]);
  }

  if (resultsChart) {
    resultsChart.destroy();
  }

  const totalVotes = data.reduce((a, b) => a + b, 0);
  console.log("Total votes to display:", totalVotes);
  
  resultsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Vote Count",
        data,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      animation: {
        duration: 300
      },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: `📊 Live Election Results (Total Votes: ${totalVotes})`,
          font: { size: 16, weight: 600 }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}
