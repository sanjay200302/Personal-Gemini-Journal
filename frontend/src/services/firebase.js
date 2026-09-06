// Firebase initialization
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  import.meta.env.REACT_APP_FIREBASE_API_KEY ||
  "AIzaSyBSKh94VTB0E6bmS7by2Eu7UjIfIf-5IsA";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "personal-gemini-journal-651b7.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.REACT_APP_FIREBASE_PROJECT_ID ||
    "personal-gemini-journal-651b7",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "personal-gemini-journal-651b7.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    "953877951903",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    import.meta.env.REACT_APP_FIREBASE_APP_ID ||
    "1:953877951903:web:05896537cab4ba180879aa",
};

const databaseId =
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  import.meta.env.REACT_APP_FIRESTORE_DATABASE_ID ||
  "default";

let app = null;
let auth = null;
let db = null;
let storage = null;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, databaseId);
    storage = getStorage(app);
  }
} catch (err) {
  console.warn("Firebase initialization skipped/fallback:", err);
}

export { app, auth, db, storage };
