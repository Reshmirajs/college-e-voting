import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBeVO0IB_6gC1BeI8bZd7nxSZ5_P-KMvpo",
  authDomain: "college-e-voting.firebaseapp.com",
  projectId: "college-e-voting",
  storageBucket: "college-e-voting.firebasestorage.app",
  messagingSenderId: "560068282591",
  appId: "1:560068282591:web:79ecdb1e20d886356f016a"
};

// ✅ Initialize ONCE
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
