import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_JooBh8t0AFbo95uAqvBaC1SoHrF3ric",
  authDomain: "attendanceapp-61d1b.firebaseapp.com",
  projectId: "attendanceapp-61d1b",
  storageBucket: "attendanceapp-61d1b.firebasestorage.app",
  messagingSenderId: "229469557617",
  appId: "1:229469557617:web:ef2d54b8fad5fe939e9cd0",
  measurementId: "G-S2WVEN05QT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
