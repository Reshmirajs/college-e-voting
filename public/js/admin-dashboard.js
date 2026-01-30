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
    console.log("⚠️ No authenticated user - redirecting to main page");
    window.location.href = "index.html";
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
const chartsContainer = document.getElementById("chartsContainer");

console.log("🔍 Checking DOM elements on page load...");
console.log("✅ candidateList:", candidateList);
console.log("✅ suspiciousBody:", suspiciousBody);
console.log("✅ chartsContainer:", chartsContainer);

let chartsMap = {}; // Store charts by position
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
      // Starting voting - KEEP EXISTING RESULTS, just allow new votes
      votingEnabled = true;
      console.log("✅ Voting session started - Previous results preserved");
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
    <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%); border-radius: 18px; border: 2px solid #4caf50; margin: 30px 0; animation: slideUp 0.6s ease;">
      <div style="font-size: 64px; margin-bottom: 20px;">🏆</div>
      <h2 style="color: #4caf50; font-size: 28px; margin-bottom: 10px; font-weight: 700;">ELECTION WINNER</h2>
      <h3 style="color: #333; font-size: 36px; margin-bottom: 10px; font-weight: 700;">${winner.name}</h3>
      <p style="color: #4caf50; font-size: 18px; margin-bottom: 25px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${winner.position}</p>
      <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
        <p style="color: #5a5a5a; font-size: 16px; margin: 0; font-weight: 500;">
          Total Votes Received: <span style="color: #4caf50; font-size: 28px; font-weight: 700;">${votes}</span>
        </p>
      </div>
    </div>
  `;
  winnerSection.style.display = "block";
}

/* ================= LOGOUT ================= */
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("✅ Admin logged out successfully");
    window.location.href = "index.html"; // Changed from /index.html to index.html
  } catch (error) {
    console.error("Logout error:", error);
    // Force redirect even if signOut fails
    window.location.href = "index.html";
  }
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

/* ================= LIVE RESULTS GRAPH (ELEGANT VERSION) ================= */
let allCandidatesMap = {};
let positionsMap = {}; // Store candidates by position

// First load all candidates
async function initCandidatesMap() {
  try {
    const candidatesSnap = await getDocs(collection(db, "candidates"));
    allCandidatesMap = {};
    positionsMap = {};
    
    candidatesSnap.forEach(c => {
      const data = c.data();
      allCandidatesMap[data.candidateId] = {
        name: data.name,
        position: data.position,
        count: 0
      };
      
      // Group by position
      if (!positionsMap[data.position]) {
        positionsMap[data.position] = [];
      }
      positionsMap[data.position].push({
        candidateId: data.candidateId,
        name: data.name,
        count: 0
      });
    });
    
    console.log("✅ Candidates loaded from database:", candidatesSnap.size, "candidates");
    console.log("📋 Positions:", Object.keys(positionsMap));
    console.log("📋 All candidates data:", allCandidatesMap);
    
    // Load existing votes first
    await loadExistingVotes();
    
    // Then setup vote listener for real-time updates
    setupVoteListener();
  } catch (err) {
    console.error("❌ Error loading candidates:", err);
  }
}

// Load all existing votes from database
async function loadExistingVotes() {
  try {
    console.log("📥 Loading existing votes from database...");
    const votesSnap = await getDocs(collection(db, "votes"));
    console.log("📋 Votes found in database:", votesSnap.size);
    
    // Reset counts
    for (const candidateId in allCandidatesMap) {
      allCandidatesMap[candidateId].count = 0;
    }
    
    for (const position in positionsMap) {
      positionsMap[position].forEach(candidate => {
        candidate.count = 0;
      });
    }
    
    // Count votes for each candidate
    votesSnap.forEach(voteDoc => {
      const voteData = voteDoc.data();
      const candidateId = voteData.candidateId;
      
      if (allCandidatesMap[candidateId]) {
        allCandidatesMap[candidateId].count++;
        
        // Update position map
        const position = allCandidatesMap[candidateId].position;
        const candidate = positionsMap[position].find(c => c.candidateId === candidateId);
        if (candidate) {
          candidate.count++;
        }
      }
    });
    
    console.log("✅ Existing votes loaded:", votesSnap.size, "votes");
    updateAllCharts();
    return true;
  } catch (err) {
    console.error("❌ Error loading existing votes:", err);
    updateAllCharts();
    return false;
  }
}

// Setup vote listener
function setupVoteListener() {
  // Listen to votes collection in real-time
  const unsubscribe = onSnapshot(
    collection(db, "votes"),
    (votesSnap) => {
      console.log("🔄 Vote listener triggered - Total votes in database:", votesSnap.size);
      
      // Reset counts
      for (const candidateId in allCandidatesMap) {
        allCandidatesMap[candidateId].count = 0;
      }
      
      for (const position in positionsMap) {
        positionsMap[position].forEach(candidate => {
          candidate.count = 0;
        });
      }

      // Count votes for each candidate
      votesSnap.forEach(voteDoc => {
        const voteData = voteDoc.data();
        const candidateId = voteData.candidateId;
        
        if (allCandidatesMap[candidateId]) {
          allCandidatesMap[candidateId].count++;
          
          // Update position map
          const position = allCandidatesMap[candidateId].position;
          const candidate = positionsMap[position].find(c => c.candidateId === candidateId);
          if (candidate) {
            candidate.count++;
          }
          
          console.log("✅ Vote counted for:", allCandidatesMap[candidateId].name, "Total now:", allCandidatesMap[candidateId].count);
        }
      });

      console.log("📊 Final vote counts:", allCandidatesMap);
      updateAllCharts();
    },
    (error) => {
      console.error("❌ Real-time listener error:", error);
      console.warn("⚠️ Real-time updates temporarily unavailable. Attempting to reconnect in 5 seconds...");
      
      setTimeout(() => {
        console.log("🔄 Attempting to reconnect to vote listener...");
        setupVoteListener();
      }, 5000);
    }
  );
  
  console.log("✅ Vote listener setup complete");
}

// Initialize candidates on page load
initCandidatesMap();

// Listen to candidates collection for updates
onSnapshot(collection(db, "candidates"), (candidatesSnap) => {
  allCandidatesMap = {};
  positionsMap = {};
  
  candidatesSnap.forEach(c => {
    const data = c.data();
    allCandidatesMap[data.candidateId] = {
      name: data.name,
      position: data.position,
      count: 0
    };
    
    // Group by position
    if (!positionsMap[data.position]) {
      positionsMap[data.position] = [];
    }
    positionsMap[data.position].push({
      candidateId: data.candidateId,
      name: data.name,
      count: 0
    });
  });
  console.log("📋 Candidates updated:", allCandidatesMap);
  updateAllCharts();
});

// Function to update all charts (one per position)
function updateAllCharts() {
  console.log("🎨 Updating all charts...");
  
  if (!chartsContainer) {
    console.error("❌ CRITICAL: chartsContainer element not found! Aborting chart update.");
    return;
  }
  
  for (const position in positionsMap) {
    console.log(`🔄 Processing position: ${position}`);
    const candidates = positionsMap[position];
    const chartId = `chart-${position.replace(/\s+/g, '-')}`;
    const canvas = document.getElementById(chartId);
    
    if (canvas && chartsMap[position]) {
      console.log(`✅ Chart exists for ${position}, updating data...`);
      updateChartData(position, candidates);
    } else {
      console.log(`🆕 Creating new chart for ${position}...`);
      createChartForPosition(position, candidates);
    }
  }
}

// Function to update chart data in place with ELEGANT STYLING
function updateChartData(position, candidates) {
  const labels = [];
  const data = [];
  const colors = [];
  
  // Find the maximum vote count (leader)
  const maxVotes = Math.max(...candidates.map(c => c.count));
  
  candidates.forEach(candidate => {
    labels.push(candidate.name);
    data.push(candidate.count);
    
    // 🎨 Green for leader(s), red for others
    if (candidate.count === maxVotes && maxVotes > 0) {
      colors.push('#4caf50'); // Green for leading
    } else {
      colors.push('#ff6b6b'); // Red for trailing
    }
  });
  
  const totalVotes = data.reduce((a, b) => a + b, 0);
  
  const chart = chartsMap[position];
  if (chart) {
    // Update chart data
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.options.plugins.title.text = `Total Votes: ${totalVotes}`;
    chart.update('none');
    console.log(`✅ Chart updated for ${position} - Total votes: ${totalVotes}`);
    
    // Update vote counts display below chart
    updateVoteCountsDisplay(position, candidates);
  }
}

// Function to display vote counts below chart
function updateVoteCountsDisplay(position, candidates) {
  const chartId = `chart-${position.replace(/\s+/g, '-')}`;
  const existingDisplay = document.getElementById(`votes-display-${chartId}`);
  
  if (existingDisplay) {
    existingDisplay.remove();
  }
  
  const chartContainer = document.getElementById(chartId)?.parentElement?.parentElement;
  if (!chartContainer) return;
  
  const votesDisplay = document.createElement("div");
  votesDisplay.id = `votes-display-${chartId}`;
  votesDisplay.style.cssText = `
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
    padding: 20px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(102, 126, 234, 0.1);
  `;
  
  // Find max votes for color coding
  const maxVotes = Math.max(...candidates.map(c => c.count));
  
  candidates.forEach(candidate => {
    const isLeading = candidate.count === maxVotes && maxVotes > 0;
    const voteBox = document.createElement("div");
    voteBox.style.cssText = `
      flex: 1;
      min-width: 150px;
      padding: 15px 20px;
      background: ${isLeading ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)' : 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 82, 82, 0.1) 100%)'};
      border-radius: 10px;
      text-align: center;
      border: 2px solid ${isLeading ? '#4caf50' : '#ff6b6b'};
      transition: all 0.3s ease;
    `;
    
    voteBox.innerHTML = `
      <div style="font-size: 14px; color: #666; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${candidate.name}
      </div>
      <div style="font-size: 32px; font-weight: 700; color: ${isLeading ? '#4caf50' : '#ff6b6b'};">
        ${candidate.count}
      </div>
      <div style="font-size: 12px; color: #999; margin-top: 5px; font-weight: 500;">
        ${candidate.count === 1 ? 'vote' : 'votes'}
        ${isLeading && maxVotes > 0 ? ' 🏆' : ''}
      </div>
    `;
    
    votesDisplay.appendChild(voteBox);
  });
  
  chartContainer.appendChild(votesDisplay);
}

// Function to create a chart for a specific position with ELEGANT STYLING
function createChartForPosition(position, candidates) {
  console.log(`📊 Creating chart for position: ${position}`);
  
  if (!chartsContainer) {
    console.error("❌ CRITICAL: chartsContainer is null! Cannot create chart.");
    return;
  }
  
  // Create container div for this position's chart
  const chartDiv = document.createElement("div");
  chartDiv.style.cssText = `
    margin-bottom: 40px;
    padding: 30px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 18px;
    border: 1px solid rgba(102, 126, 234, 0.2);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  `;
  
  chartDiv.addEventListener('mouseenter', () => {
    chartDiv.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.15)';
    chartDiv.style.transform = 'translateY(-2px)';
  });
  
  chartDiv.addEventListener('mouseleave', () => {
    chartDiv.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
    chartDiv.style.transform = 'translateY(0)';
  });
  
  const title = document.createElement("h4");
  title.textContent = position;
  title.style.cssText = `
    color: #667eea;
    margin-bottom: 20px;
    font-size: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(102, 126, 234, 0.2);
  `;
  chartDiv.appendChild(title);
  
  // Create canvas wrapper
  const canvasWrapper = document.createElement("div");
  canvasWrapper.style.cssText = `
    position: relative;
    height: 350px;
    margin-bottom: 10px;
  `;
  
  // Create canvas for this chart
  const canvas = document.createElement("canvas");
  canvas.id = `chart-${position.replace(/\s+/g, '-')}`;
  canvasWrapper.appendChild(canvas);
  chartDiv.appendChild(canvasWrapper);
  
  chartsContainer.appendChild(chartDiv);
  console.log(`✅ Chart container added to DOM for ${position}`);
  
  // Prepare data
  const labels = [];
  const data = [];
  const colors = [];
  
  // Find max votes for color coding
  const maxVotes = Math.max(...candidates.map(c => c.count));
  
  candidates.forEach(candidate => {
    labels.push(candidate.name);
    data.push(candidate.count);
    
    // Green for leader, red for others
    if (candidate.count === maxVotes && maxVotes > 0) {
      colors.push('#4caf50');
    } else {
      colors.push('#ff6b6b');
    }
  });
  
  if (labels.length === 0) {
    labels.push("No candidates");
    data.push(0);
    colors.push("#cccccc");
  }
  
  const totalVotes = data.reduce((a, b) => a + b, 0);
  console.log(`📊 ${position} - Total votes:`, totalVotes, "Candidates:", labels.length);
  
  // Destroy old chart if exists
  if (chartsMap[position]) {
    chartsMap[position].destroy();
  }
  
  // Create new chart with elegant styling
  const ctx = canvas.getContext("2d");
  chartsMap[position] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Vote Count",
        data,
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
        borderWidth: 0,
        barThickness: 60,
        maxBarThickness: 80
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: { 
          display: false
        },
        title: {
          display: true,
          text: `Total Votes: ${totalVotes}`,
          font: { 
            size: 18, 
            weight: 700,
            family: 'Inter, sans-serif'
          },
          color: '#667eea',
          padding: {
            bottom: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 600
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y} ${context.parsed.y === 1 ? 'vote' : 'votes'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12,
              weight: 500
            },
            color: '#666'
          },
          grid: {
            color: 'rgba(102, 126, 234, 0.1)',
            drawBorder: false
          },
          title: {
            display: true,
            text: "Number of Votes",
            font: {
              size: 13,
              weight: 600
            },
            color: '#667eea'
          }
        },
        x: {
          ticks: {
            font: {
              size: 13,
              weight: 600
            },
            color: '#333'
          },
          grid: {
            display: false
          },
          title: {
            display: true,
            text: "Candidates",
            font: {
              size: 13,
              weight: 600
            },
            color: '#667eea'
          }
        }
      }
    }
  });
  
  // Add vote counts display below chart
  updateVoteCountsDisplay(position, candidates);
}

/* ================= CLEAR RESULTS BUTTON ================= */
const clearResultsBtn = document.getElementById("clearResultsBtn");

if (clearResultsBtn) {
  clearResultsBtn.addEventListener("click", async () => {
    const confirmed = confirm(
      "⚠️ WARNING: This will permanently delete ALL votes and reset student voting status.\n\n" +
      "Are you sure you want to clear all election results?"
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      clearResultsBtn.disabled = true;
      clearResultsBtn.textContent = "⏳ Clearing...";
      
      console.log("🗑️ Starting to clear all results...");
      
      // 1. Reset all students' hasVoted flag
      const studentsSnap = await getDocs(collection(db, "students"));
      const resetPromises = [];
      studentsSnap.forEach(student => {
        resetPromises.push(setDoc(doc(db, "students", student.id), { hasVoted: false }, { merge: true }));
      });
      await Promise.all(resetPromises);
      console.log("✅ Reset all students' voting status");
      
      // 2. Clear all votes from votes collection
      const votesSnap = await getDocs(collection(db, "votes"));
      const deletePromises = [];
      votesSnap.forEach(vote => {
        deletePromises.push(deleteDoc(doc(db, "votes", vote.id)));
      });
      await Promise.all(deletePromises);
      console.log("✅ Deleted all votes");
      
      // 3. Hide winner section
      const winnerSection = document.getElementById("winnerSection");
      if (winnerSection) {
        winnerSection.style.display = "none";
      }
      currentWinner = null;
      
      // 4. Stop voting if active
      if (votingEnabled) {
        votingEnabled = false;
        await setDoc(doc(db, "system", "votingStatus"), { enabled: false });
      }
      
      clearResultsBtn.textContent = "✅ Results Cleared!";
      clearResultsBtn.style.background = "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)";
      
      setTimeout(() => {
        clearResultsBtn.disabled = false;
        clearResultsBtn.textContent = "Clear Results";
        clearResultsBtn.style.background = "linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)";
      }, 2000);
      
      console.log("🎉 All results cleared successfully!");
      alert("✅ All election results have been cleared successfully!");
      
    } catch (error) {
      console.error("❌ Error clearing results:", error);
      alert("❌ Failed to clear results: " + error.message);
      clearResultsBtn.disabled = false;
      clearResultsBtn.textContent = "🗑️ Clear All Results";
    }
  });
}