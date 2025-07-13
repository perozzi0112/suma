import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin si no está inicializado y las variables están disponibles
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Error inicializando Firebase Admin:', error);
    }
  } else {
    console.warn('Firebase Admin no inicializado: variables de entorno faltantes');
  }
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    // Verificar que Firebase Admin esté inicializado
    if (getApps().length === 0) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado' },
        { status: 500 }
      );
    }

    const { userId, fcmToken } = await request.json();

    console.log('🔑 Actualizando token FCM para usuario:', userId);

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: 'userId y fcmToken son requeridos' },
        { status: 400 }
      );
    }

    // Actualizar token FCM en Firestore
    await db.collection('users').doc(userId).update({
      fcmToken,
      fcmTokenUpdatedAt: new Date(),
    });

    console.log('✅ Token FCM actualizado exitosamente');

    return NextResponse.json({ 
      success: true,
      message: 'Token FCM actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error al actualizar token FCM:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 