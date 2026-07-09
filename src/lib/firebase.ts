import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import fileConfig from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fileConfig.apiKey || "AIzaSyCpwOfxePPlKe6XMI-q_yIVxpPvXhk9wcU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || "gen-lang-client-0877049752.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId || "gen-lang-client-0877049752",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket || "gen-lang-client-0877049752.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId || "192728686515",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fileConfig.appId || "1:192728686515:web:8f5ec0dda9f7d6351135c6"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to prevent stream disconnect issues
const isDefaultProject = firebaseConfig.projectId === "gen-lang-client-0877049752";
const databaseId = fileConfig.firestoreDatabaseId || (isDefaultProject ? "ai-studio-proteino-92e8528c-0985-4bdc-91be-6336ab0ac867" : undefined);

export const db = databaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, databaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
