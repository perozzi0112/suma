import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Provides a more helpful error message if the environment variables are missing.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("AIza...")) {
  console.error("🔥🔥🔥 ERROR DE CONFIGURACIÓN FIREBASE 🔥🔥🔥");
  console.error("No se ha encontrado la 'API Key'. Por favor, asegúrate de que tu archivo .env contenga la variable NEXT_PUBLIC_FIREBASE_API_KEY con un valor válido.");
}


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
