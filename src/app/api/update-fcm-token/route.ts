import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
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