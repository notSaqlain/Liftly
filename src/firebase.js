// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: log config to verify env vars are loaded (remove in production)
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("🚨 FIREBASE CONFIG ERROR: Missing critical environment variables!");
  console.error("Current config:", JSON.stringify(firebaseConfig, null, 2));
  console.error("Make sure .env file exists at project root and restart `npm run dev`.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in production (it can cause issues on localhost)
let analytics = null;
try {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    import("firebase/analytics").then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    });
  }
} catch (e) {
  console.warn("Analytics initialization skipped:", e.message);
}

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
});

export default app;