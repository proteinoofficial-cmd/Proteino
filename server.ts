import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fileConfig from "./firebase-applet-config.json";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data-store.json");

app.use(express.json());

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || fileConfig.apiKey || "AIzaSyCpwOfxePPlKe6XMI-q_yIVxpPvXhk9wcU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || "gen-lang-client-0877049752.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || "gen-lang-client-0877049752",
  storageBucket: process.env.FIREBASE_PROJECT_ID || fileConfig.projectId
    ? `${process.env.FIREBASE_PROJECT_ID || fileConfig.projectId}.firebasestorage.app` 
    : "gen-lang-client-0877049752.firebasestorage.app",
  appId: process.env.FIREBASE_APP_ID || fileConfig.appId || "1:192728686515:web:8f5ec0dda9f7d6351135c6"
};

let db: any = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    
    // Dynamic database ID selection: use custom db ID from config file or default back
    const defaultDbId = fileConfig.firestoreDatabaseId || (firebaseConfig.projectId === "gen-lang-client-0877049752" 
      ? "ai-studio-proteino-92e8528c-0985-4bdc-91be-6336ab0ac867" 
      : "");
    const databaseId = process.env.FIREBASE_DATABASE_ID || defaultDbId;
    
    // Treat "(default)" or empty string as default database
    const shouldUseDbId = databaseId && databaseId !== "(default)" && databaseId !== "";
    
    if (shouldUseDbId) {
      db = initializeFirestore(firebaseApp, {}, databaseId);
    } else {
      db = initializeFirestore(firebaseApp, {});
    }
    console.log("Firebase initialized successfully with project ID:", firebaseConfig.projectId, "and database ID:", shouldUseDbId ? databaseId : "(default)");
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
} else {
  console.log("Firebase credentials not fully provided. Running in local JSON storage fallback mode.");
}



// CORS Middleware to support cross-origin requests from custom domains (Vercel)
app.use((req, res, next) => {
  let origin = req.headers.origin;
  
  // Fallback to referer origin if req.headers.origin is not provided (common for GET requests)
  if (!origin && req.headers.referer) {
    try {
      const urlObj = new URL(req.headers.referer);
      origin = urlObj.origin;
    } catch (e) {}
  }

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to ensure the Firestore data is loaded on serverless cold starts
app.use(async (req, res, next) => {
  if (db && req.path.startsWith("/api/")) {
    try {
      await loadStoreFromFirebase();
    } catch (e) {
      console.error("Failed to load store during request:", e);
    }
  }
  next();
});

// Initialize store
let store = {
  orders: [] as any[],
  subscriptions: [] as any[],
  users: [] as any[]
};

// Load existing data from file if present
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    store = JSON.parse(data);
    if (!Array.isArray(store.orders)) store.orders = [];
    if (!Array.isArray(store.subscriptions)) store.subscriptions = [];
    if (!Array.isArray(store.users)) store.users = [];
    console.log("Loaded data store from file with", store.orders.length, "orders and", store.subscriptions.length, "subscriptions.");
  } catch (err) {
    console.error("Failed to parse data-store.json, using fresh store.", err);
  }
} else {
  // Seed with a default sample order if empty
  store.orders = [
    {
      id: "PRTN-2904",
      date: "Today, 08:30 AM",
      customerName: "Sarah Connor",
      customerPhone: "9876543210",
      gymName: "Gold's Gym - Indiranagar",
      gymLocation: "80 Feet Rd, Hal 3rd Stage, Indiranagar, Bengaluru",
      deliveryTimeSlot: "2 PM",
      items: [
        {
          product: {
            id: 'nonveg-bulk-35p',
            name: 'Non-Veg BULK 35P',
            price: 229,
            protein: 35,
            calories: 700,
            isVeg: false
          },
          quantity: 1,
          purchaseOption: "single"
        }
      ],
      total: 229,
      status: "cooking",
      deliveryTimeRemaining: 24
    }
  ];
}

// Ensure there is at least Sarah Connor as default user for testing
if (!store.users || store.users.length === 0) {
  store.users = [
    {
      name: "Sarah Connor",
      phone: "9876543210",
      password: "1234",
      goal: "gain",
      weight: 70,
      height: 175,
      dailyCalorieGoal: 2100,
      dailyProteinGoal: 126,
      email: "9876543210@proteino.com"
    }
  ];
}

let lastLoadTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

async function loadStoreFromFirebase(force = false) {
  if (!db) return;
  const now = Date.now();
  if (!force && lastLoadTime && (now - lastLoadTime < CACHE_TTL_MS)) {
    return;
  }
  try {
    console.log("Attempting to load data store from Firebase...");
    const docRef = doc(db, "app_state", "proteino_store");
    
    // Add a 4-second safety timeout so we don't hang requests on serverless environments
    const docSnap: any = await Promise.race([
      getDoc(docRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore sync timeout (4s exceeded)")), 4000))
    ]);
    
    if (docSnap && docSnap.exists()) {
      const dbStore = docSnap.data().data;
      if (dbStore) {
        if (Array.isArray(dbStore.orders)) store.orders = dbStore.orders;
        if (Array.isArray(dbStore.subscriptions)) store.subscriptions = dbStore.subscriptions;
        if (Array.isArray(dbStore.users)) store.users = dbStore.users;
        lastLoadTime = Date.now();
        console.log(`Successfully synced state from Firebase! Loaded:
          - ${store.orders.length} orders
          - ${store.subscriptions.length} subscriptions
          - ${store.users.length} users`);
      }
    } else {
      console.log("No existing data found in Firestore for document 'app_state/proteino_store'.");
    }
  } catch (err: any) {
    console.error("Failed to load store from Firebase:", err.message || err);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write data-store.json:", err);
  }

  if (db) {
    const docRef = doc(db, "app_state", "proteino_store");
    setDoc(docRef, {
      data: store,
      updated_at: new Date().toISOString()
    })
    .then(() => {
      lastLoadTime = Date.now(); // Mark as up-to-date since we just wrote our state
      console.log("Successfully synced store to Firebase Firestore!");
    })
    .catch((err: any) => {
      console.error("Failed to sync store to Firebase:", err.message || err);
    });
  }
}


// API Routes
app.post("/api/auth/register", (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingUser = store.users.find(u => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ error: "Mobile number already registered. Please log in instead." });
  }

  const newUser = {
    name,
    phone,
    password,
    email: `${phone}@proteino.com`,
    goal: "gain",
    weight: 70,
    height: 175,
    dailyCalorieGoal: 2100,
    dailyProteinGoal: 126
  };

  store.users.push(newUser);
  saveStore();

  res.status(201).json(newUser);
});

app.post("/api/auth/login", (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const user = store.users.find(u => u.phone === phone);
  if (!user) {
    return res.status(400).json({ error: "No account found with this mobile number. Please register first." });
  }

  if (user.password !== password) {
    return res.status(400).json({ error: "Incorrect password. Please try again." });
  }

  res.json(user);
});

app.post("/api/auth/google", (req, res) => {
  const { name, email, uid, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  let user = store.users.find(u => u.email === email);
  if (!user) {
    const generatedPhone = `G-${uid ? uid.slice(0, 8) : Math.floor(100000 + Math.random() * 900000)}`;
    user = {
      name: name || "Google Athlete",
      phone: generatedPhone,
      password: `google_${uid || Date.now()}`,
      email: email,
      goal: "gain",
      weight: 70,
      height: 175,
      dailyCalorieGoal: 2100,
      dailyProteinGoal: 126,
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    };
    store.users.push(user);
    saveStore();
  }

  res.json(user);
});

app.post("/api/auth/reset-password", (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "Mobile number and new password are required" });
  }

  const userIndex = store.users.findIndex(u => u.phone === phone);
  if (userIndex === -1) {
    return res.status(404).json({ error: "No registered account found with this mobile number." });
  }

  store.users[userIndex].password = password;
  saveStore();

  res.json({ success: true, message: "Password updated successfully" });
});

// Google OAuth & Simulator Endpoints
const getRedirectUri = (req: any): string => {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  let origin = `${protocol}://${host}`;

  // If the user is on a custom domain (not run.app, localhost, or 127.0.0.1), use the request origin directly
  // Otherwise, fall back to the configured APP_URL env variable if present.
  const isCustomDomain = !host.includes("run.app") && !host.includes("localhost") && !host.includes("127.0.0.1");

  if (!isCustomDomain) {
    const appUrl = process.env.APP_URL;
    if (appUrl && appUrl !== "MY_APP_URL") {
      try {
        const appUrlObj = new URL(appUrl);
        origin = appUrlObj.origin;
      } catch (e) {}
    }
  }

  return `${origin}/auth/callback`;
};

app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientOrigin = req.query.origin as string;
  const redirectUri = getRedirectUri(req);

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state: clientOrigin || ""
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, isMock: false });
  } else {
    // Redirect to local simulator with the computed redirect_uri (ensuring it is an absolute URL pointing to the backend)
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const backendOrigin = `${protocol}://${host}`;
    res.json({ url: `${backendOrigin}/auth/google/simulator?redirect_uri=${encodeURIComponent(redirectUri)}`, isMock: true });
  }
});

// Google Sign-In Simulator View
app.get("/auth/google/simulator", (req, res) => {
  const { redirect_uri } = req.query;
  const redirectStr = Array.isArray(redirect_uri) ? redirect_uri[0] : (redirect_uri as string) || "/auth/callback";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google Sign-In Simulator</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body class="bg-slate-50 flex items-center justify-center min-h-screen p-4">
      <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-md w-full relative overflow-hidden">
        
        <!-- Google Color Strip -->
        <div class="absolute top-0 left-0 right-0 h-1.5 flex">
          <div class="w-1/4 bg-[#4285F4]"></div>
          <div class="w-1/4 bg-[#EA4335]"></div>
          <div class="w-1/4 bg-[#FBBC05]"></div>
          <div class="w-1/4 bg-[#34A853]"></div>
        </div>

        <div class="flex flex-col items-center text-center mt-4">
          <!-- Google SVG Logo -->
          <svg class="w-10 h-10 mb-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <h2 class="text-xl font-extrabold text-slate-900">Sign in with Google</h2>
          <p class="text-xs font-semibold text-slate-400 mt-1">Google OAuth Sandbox Environment</p>
          <div class="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 text-[10px] text-amber-700 font-medium text-left mt-4 leading-relaxed">
            ⚠️ <strong>Sandbox Notice:</strong> <code>GOOGLE_CLIENT_ID</code> is not configured in .env yet. Choose or enter a demo account to simulate Google authentication. Setting the environment variables unlocks the real Google login.
          </div>
        </div>

        <!-- Quick Select Mock Accounts -->
        <div class="mt-6 flex flex-col gap-2.5">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Choose a Demo Account</p>
          
          <button type="button" onclick="selectAccount('Sarah Connor', 'sarah.connor@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120')" class="w-full flex items-center gap-3 p-3 border border-slate-100 hover:border-[#4285F4] hover:bg-slate-50/50 rounded-2xl text-left transition-all cursor-pointer">
            <img class="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" alt="Sarah Connor">
            <div>
              <p class="text-xs font-black text-slate-800">Sarah Connor</p>
              <p class="text-[10px] text-slate-400 font-semibold">sarah.connor@gmail.com</p>
            </div>
            <span class="ml-auto text-xs font-bold text-[#4285F4] opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
          </button>

          <button type="button" onclick="selectAccount('Bruce Wayne', 'bruce.wayne@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120')" class="w-full flex items-center gap-3 p-3 border border-slate-100 hover:border-[#4285F4] hover:bg-slate-50/50 rounded-2xl text-left transition-all cursor-pointer">
            <img class="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" alt="Bruce Wayne">
            <div>
              <p class="text-xs font-black text-slate-800">Bruce Wayne</p>
              <p class="text-[10px] text-slate-400 font-semibold">bruce.wayne@gmail.com</p>
            </div>
            <span class="ml-auto text-xs font-bold text-[#4285F4] opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
          </button>
        </div>

        <!-- Custom Account Form -->
        <div class="mt-6 pt-5 border-t border-slate-100">
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Or Use a Custom Account</p>
          
          <form onsubmit="handleCustomSubmit(event)" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
              <input required id="custom-name" type="text" placeholder="e.g. John Doe" class="text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#4285F4] focus:bg-white rounded-xl outline-none">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[9px] font-bold text-slate-400 uppercase">Google Email</label>
              <input required id="custom-email" type="email" placeholder="e.g. john.doe@gmail.com" class="text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#4285F4] focus:bg-white rounded-xl outline-none">
            </div>
            <button type="submit" class="w-full py-2.5 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all">
              Continue with Custom Account
            </button>
          </form>
        </div>

      </div>

      <script>
        const redirectUri = "${redirectStr}";

        function selectAccount(name, email, picture) {
          const sub = "mock_" + Math.random().toString(36).substr(2, 9);
          const params = new URLSearchParams({
            code: "mock_code",
            name,
            email,
            picture,
            sub
          });
          window.location.href = redirectUri + "?" + params.toString();
        }

        function handleCustomSubmit(e) {
          e.preventDefault();
          const name = document.getElementById("custom-name").value;
          const email = document.getElementById("custom-email").value;
          const picture = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
          selectAccount(name, email, picture);
        }
      </script>
    </body>
    </html>
  `);
});

// Callback route handler supporting both Real Google OAuth and Google Sign-In Simulator
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, name, email, picture, sub, state } = req.query;

  let finalName = (name as string) || "";
  let finalEmail = (email as string) || "";
  let finalPicture = (picture as string) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
  let finalSub = (sub as string) || "";
  let errorDetails = "";

  const redirectUri = getRedirectUri(req);

  // If there is no mock user query parameters, and we have a real Google Client ID, run the real token exchange
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (code && !name && clientId && clientSecret) {
    try {
      // 2. Exchange authorization code for access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        // 3. Retrieve user profile using access token
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        if (userinfoRes.ok) {
          const gProfile = await userinfoRes.json();
          finalName = gProfile.name;
          finalEmail = gProfile.email;
          finalPicture = gProfile.picture;
          finalSub = gProfile.sub;
        } else {
          const bodyText = await userinfoRes.text();
          errorDetails = `Failed to get userinfo: Status ${userinfoRes.status}. Body: ${bodyText}`;
          console.error(errorDetails);
        }
      } else {
        const bodyText = await tokenRes.text();
        errorDetails = `Failed to exchange token: Status ${tokenRes.status}. Body: ${bodyText}`;
        console.error(errorDetails);
      }
    } catch (err: any) {
      errorDetails = `Network/Exception occurred during exchange: ${err?.message || err}`;
      console.error("Failed to perform real Google OAuth exchange:", err);
    }
  } else if (code && !name) {
    errorDetails = `Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable in the sandbox configuration. Make sure you set both of them in the Secrets tab!`;
  }

  // Ensure we have some default details if everything failed
  if (!finalEmail) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; text-align: center;">
          <h3 style="color: #EA4335; margin-bottom: 8px;">Google Authentication Failed</h3>
          <p style="margin-bottom: 16px; font-size: 14px;">We could not retrieve your account info. Please close this window and try again.</p>
          ${errorDetails ? `<pre style="font-size: 11px; color: #ef4444; background: #fee2e2; border: 1px solid #fca5a5; padding: 12px; border-radius: 8px; max-width: 600px; overflow-x: auto; font-family: monospace; text-align: left; margin: 0 auto 20px auto; white-space: pre-wrap; word-break: break-all;">${errorDetails}</pre>` : ''}
          <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 11px; font-family: monospace; text-align: left; max-width: 600px; margin: 0 auto 20px auto; word-break: break-all; border: 1px solid #cbd5e1;">
            <strong style="color: #334155;">Computed Redirect URI for your domain:</strong><br/>
            <span style="color: #2563eb;">${redirectUri}</span>
            <br/><br/>
            <strong style="color: #334155;">How to fix:</strong> Ensure you have added this exact Redirect URI to your Google Cloud Console OAuth 2.0 Client credentials under <strong>Authorized redirect URIs</strong>!
          </div>
          <button onclick="window.close()" style="padding: 10px 20px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px;">Close Window</button>
        </body>
      </html>
    `);
  }

  // Look up existing user by Google email or create a new user profile
  let user = store.users.find(u => u.email === finalEmail);
  if (!user) {
    const generatedPhone = `G-${finalSub ? finalSub.slice(0, 8) : Math.floor(100000 + Math.random() * 900000)}`;
    user = {
      name: finalName || "Google Athlete",
      phone: generatedPhone,
      password: `google_${finalSub || Date.now()}`,
      email: finalEmail,
      goal: "gain",
      weight: 70,
      height: 175,
      dailyCalorieGoal: 2100,
      dailyProteinGoal: 126,
      avatar: finalPicture
    };
    store.users.push(user);
    saveStore();
  }

  // Respond with original clean script, saving to localStorage and notifying opener without displaying a success UI
  res.send(`
    <html>
      <body>
        <script>
          const profile = ${JSON.stringify(user)};
          try {
            localStorage.setItem('proteino_profile', JSON.stringify(profile));
          } catch (e) {
            console.error('Failed to save to localStorage:', e);
          }

          if (window.opener) {
            try {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', profile: profile }, '*');
            } catch (e) {
              console.error('Failed to postMessage to opener:', e);
            }
            try {
              window.close();
            } catch (e) {
              console.error('Failed to close window:', e);
            }
          } else {
            window.location.href = "${(state as string) || '/'}";
          }
        </script>
      </body>
    </html>
  `);
});

app.get("/api/orders", (req, res) => {
  const { phone, admin } = req.query;
  if (admin === 'true') {
    return res.json(store.orders);
  }
  if (!phone) {
    return res.json([]);
  }
  return res.json(store.orders.filter(o => o.customerPhone === phone));
});

app.post("/api/orders", (req, res) => {
  const newOrder = req.body;
  let orderId = newOrder.id || `PRTN-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Ensure unique order ID
  while (store.orders.some(o => o.id === orderId)) {
    orderId = `PRTN-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  newOrder.id = orderId;

  if (!newOrder.date) {
    newOrder.date = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
  }
  store.orders.unshift(newOrder); // Add to beginning
  saveStore();
  res.status(201).json(newOrder);
});

app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderIdx = store.orders.findIndex(o => o.id === id);
  if (orderIdx !== -1) {
    store.orders[orderIdx].status = status;
    saveStore();
    res.json(store.orders[orderIdx]);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.get("/api/subscriptions", (req, res) => {
  const { phone, admin } = req.query;
  if (admin === 'true') {
    return res.json(store.subscriptions);
  }
  if (!phone) {
    return res.json([]);
  }
  return res.json(store.subscriptions.filter(s => s.customerPhone === phone));
});

app.post("/api/subscriptions", (req, res) => {
  const {
    planId,
    planName,
    price,
    durationDays,
    customerName,
    customerPhone,
    gymId,
    gymName,
    gymLocation,
    timeSlot,
    isPaused
  } = req.body;

  if (!customerPhone) {
    return res.status(400).json({ error: "Customer phone is required" });
  }

  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const newSub = {
    id: `SUB-${Math.floor(100000 + Math.random() * 900000)}`,
    planId,
    planName,
    price,
    durationDays,
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    customerName,
    customerPhone,
    gymId,
    gymName,
    gymLocation,
    timeSlot,
    isPaused: isPaused || false,
    pausedAt: isPaused ? now.toISOString() : undefined,
    status: "active"
  };

  store.subscriptions.unshift(newSub);
  saveStore();
  res.json(newSub);
});

// Sync delete/cancel of sub
app.delete("/api/subscriptions/:idOrPhone", (req, res) => {
  const { idOrPhone } = req.params;
  store.subscriptions = store.subscriptions.filter(sub => sub.id !== idOrPhone && sub.customerPhone !== idOrPhone);
  saveStore();
  res.json({ success: true });
});

// Toggle pause endpoint
app.put("/api/subscriptions/:idOrPhone/pause", (req, res) => {
  const { idOrPhone } = req.params;
  const subIdx = store.subscriptions.findIndex(sub => sub.id === idOrPhone || sub.customerPhone === idOrPhone);
  if (subIdx !== -1) {
    const sub = store.subscriptions[subIdx];
    const isPausedNow = !sub.isPaused;
    sub.isPaused = isPausedNow;
    sub.pausedAt = isPausedNow ? new Date().toISOString() : undefined;
    saveStore();
    res.json(sub);
  } else {
    res.status(404).json({ error: "Subscription not found" });
  }
});

// Update subscription status endpoint (active/completed)
app.put("/api/subscriptions/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const subIdx = store.subscriptions.findIndex(sub => sub.id === id);
  if (subIdx !== -1) {
    store.subscriptions[subIdx].status = status;
    saveStore();
    res.json(store.subscriptions[subIdx]);
  } else {
    res.status(404).json({ error: "Subscription not found" });
  }
});

// Wildcard API fallback to return JSON instead of HTML SPA fallback for unmatched api routes
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Start dev server helper
async function startServer() {
  // Sync initial state from Firebase Firestore before starting up the server
  await loadStoreFromFirebase();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server directly if not running as a Vercel Serverless Function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
