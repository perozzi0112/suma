// scripts/clean_firestore_and_auth.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

dotenv.config();

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
  } else {
    throw new Error('No se encontraron credenciales de Firebase Admin.');
  }
}

const db = getFirestore();
const auth = getAuth();

const ADMIN_EMAIL = 'Perozzi0112@gmail.com';

async function cleanUsers() {
  // Firestore: Eliminar todos los usuarios menos el admin
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.email !== ADMIN_EMAIL) {
      await doc.ref.delete();
      console.log(`Usuario Firestore eliminado: ${data.email}`);
    }
  }

  // Firebase Auth: Eliminar todos los usuarios menos el admin
  let nextPageToken: string | undefined = undefined;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    for (const userRecord of listUsersResult.users) {
      if (userRecord.email !== ADMIN_EMAIL) {
        await auth.deleteUser(userRecord.uid);
        console.log(`Usuario Auth eliminado: ${userRecord.email}`);
      }
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
}

async function cleanAppointments() {
  const appointmentsRef = db.collection('appointments');
  const snapshot = await appointmentsRef.get();
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    console.log(`Cita eliminada: ${doc.id}`);
  }
}

async function main() {
  await cleanUsers();
  await cleanAppointments();
  console.log('Limpieza completada.');
}

main().catch((err) => {
  console.error('Error en limpieza:', err);
  process.exit(1);
}); 