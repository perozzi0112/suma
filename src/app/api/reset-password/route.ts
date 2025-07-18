import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  let adminConfig;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    adminConfig = {
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminConfig = {};
  }
  if (adminConfig) {
    initializeApp(adminConfig);
  } else {
    console.error('Firebase Admin no inicializado: variables de entorno faltantes');
  }
}
const db = getFirestore();
const auth = getAuth();

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }
    // Validar token
    const doc = await db.collection('passwordResets').doc(email).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 400 });
    }
    const data = doc.data();
    if (!data || data.token !== token) {
      return NextResponse.json({ success: false, error: 'Token incorrecto' }, { status: 400 });
    }
    if (Date.now() > data.expiresAt) {
      return NextResponse.json({ success: false, error: 'Token expirado' }, { status: 400 });
    }
    // Cambiar contraseña en Firebase Auth
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password });
    // Eliminar token
    await db.collection('passwordResets').doc(email).delete();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Error al restablecer la contraseña';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 