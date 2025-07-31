import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  let adminConfig;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    adminConfig = {
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    };
    console.log("Usando FIREBASE_SERVICE_ACCOUNT para inicializar Firebase Admin");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminConfig = {};
    console.log("Usando GOOGLE_APPLICATION_CREDENTIALS para inicializar Firebase Admin");
  } else {
    throw new Error("Firebase Admin no inicializado: variables de entorno faltantes");
  }
  app = initializeApp(adminConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app }; 