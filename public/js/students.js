import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { app } from "./firebase-config.js";

/* ================= AUTH ================= */
const auth = getAuth(app);

// 🔒 Protect students page
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("⚠️ No authenticated user - redirecting to main page");
    window.location.href = "index.html";
  }
});

/* ================= DOM ELEMENTS ================= */
const searchInput = document.getElementById("searchInput");
const studentsTableBody = document.getElementById("studentsTableBody");
const studentsTable = document.getElementById("studentsTable");
const loadingDiv = document.getElementById("loadingDiv");
const noResults = document.getElementById("noResults");
const totalStudentsEl = document.getElementById("totalStudents");
const votedCountEl = document.getElementById("votedCount");
const pendingCountEl = document.getElementById("pendingCount");

let allStudents = [];
let filteredStudents = [];

/* ================= LOAD STUDENTS ================= */
async function loadStudents() {
  try {
    console.log("📥 Loading students from database...");
    loadingDiv.style.display = "block";
    studentsTable.style.display = "none";
    noResults.style.display = "none";

    const studentsSnap = await getDocs(collection(db, "students"));
    allStudents = [];

    studentsSnap.forEach(docSnap => {
      const data = docSnap.data();
      allStudents.push({
        id: docSnap.id,
        admissionNo: data.admissionNo || docSnap.id,
        email: data.email || "N/A",
        hasVoted: data.hasVoted || false,
        createdAt: data.createdAt?.toDate() || null,
        votedAt: data.votedAt?.toDate() || null
      });
    });

    console.log("✅ Loaded", allStudents.length, "students");
    filteredStudents = [...allStudents];
    updateStats();
    renderStudents();

  } catch (error) {
    console.error("❌ Error loading students:", error);
    loadingDiv.innerHTML = `
      <div style="color: #ff6b6b;">
        ❌ Error loading students: ${error.message}
      </div>
    `;
  }
}

/* ================= UPDATE STATISTICS ================= */
function updateStats() {
  const total = allStudents.length;
  const voted = allStudents.filter(s => s.hasVoted).length;
  const pending = total - voted;

  totalStudentsEl.textContent = total;
  votedCountEl.textContent = voted;
  pendingCountEl.textContent = pending;
}

/* ================= RENDER STUDENTS TABLE ================= */
function renderStudents() {
  loadingDiv.style.display = "none";

  if (filteredStudents.length === 0) {
    studentsTable.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  studentsTable.style.display = "table";
  noResults.style.display = "none";
  studentsTableBody.innerHTML = "";

  // Sort by admission number
  filteredStudents.sort((a, b) => {
    return a.admissionNo.localeCompare(b.admissionNo);
  });

  filteredStudents.forEach(student => {
    const row = document.createElement("tr");

    // Voting status badge
    const statusBadge = student.hasVoted
      ? '<span class="status-badge status-voted">✓ Voted</span>'
      : '<span class="status-badge status-pending">⏳ Pending</span>';

    row.innerHTML = `
      <td style="font-weight: 600;">${student.admissionNo}</td>
      <td>${student.email}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="delete-btn" data-id="${student.id}" data-admission="${student.admissionNo}">
          Delete
        </button>
      </td>
    `;

    studentsTableBody.appendChild(row);
  });

  // Add delete event listeners
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const studentId = e.target.dataset.id;
      const admissionNo = e.target.dataset.admission;
      await deleteStudent(studentId, admissionNo);
    });
  });
}

/* ================= SEARCH FUNCTIONALITY ================= */
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();

  if (searchTerm === "") {
    filteredStudents = [...allStudents];
  } else {
    filteredStudents = allStudents.filter(student => {
      return (
        student.admissionNo.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm)
      );
    });
  }

  renderStudents();
});

/* ================= DELETE STUDENT ================= */
async function deleteStudent(studentId, admissionNo) {
  const confirmed = confirm(
    `Are you sure you want to delete student "${admissionNo}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    console.log("🗑️ Deleting student:", admissionNo);
    await deleteDoc(doc(db, "students", studentId));
    console.log("✅ Student deleted successfully");

    // Remove from local array
    allStudents = allStudents.filter(s => s.id !== studentId);
    filteredStudents = filteredStudents.filter(s => s.id !== studentId);

    updateStats();
    renderStudents();

    // Show success message briefly
    const deleteBtn = document.querySelector(`[data-id="${studentId}"]`);
    if (deleteBtn) {
      deleteBtn.textContent = "✓ Deleted";
      deleteBtn.style.background = "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)";
      deleteBtn.disabled = true;
    }

  } catch (error) {
    console.error("❌ Error deleting student:", error);
    alert("Failed to delete student: " + error.message);
  }
}

/* ================= REAL-TIME UPDATES ================= */
// Listen for real-time changes to students collection
onSnapshot(collection(db, "students"), (snapshot) => {
  console.log("🔄 Students collection updated");
  loadStudents(); // Reload students when changes occur
});

/* ================= INITIALIZE ================= */
loadStudents();