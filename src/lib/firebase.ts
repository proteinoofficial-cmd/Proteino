import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpwOfxePPlKe6XMI-q_yIVxpPvXhk9wcU",
  authDomain: "gen-lang-client-0877049752.firebaseapp.com",
  projectId: "gen-lang-client-0877049752",
  storageBucket: "gen-lang-client-0877049752.firebasestorage.app",
  appId: "1:192728686515:web:8f5ec0dda9f7d6351135c6"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to prevent stream disconnect issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-proteino-92e8528c-0985-4bdc-91be-6336ab0ac867");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
