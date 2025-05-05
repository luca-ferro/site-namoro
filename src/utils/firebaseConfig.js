import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYoTrLcdaCq-O7sXyYxXfyWlz6kvrVd7g",
  authDomain: "site-tayssa.firebaseapp.com",
  databaseURL: "https://site-tayssa-default-rtdb.firebaseio.com",
  projectId: "site-tayssa",
  storageBucket: "site-tayssa.firebasestorage.app",
  messagingSenderId: "502478914094",
  appId: "1:502478914094:web:a60615d4ae3d4fabecd5bf",
  measurementId: "G-RJ314B5VMG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, push, get, child };