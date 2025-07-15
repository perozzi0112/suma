import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Función para inicializar Firebase Admin solo cuando sea necesario
function initializeFirebaseAdmin() {
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
        return true;
      } catch (error) {
        console.error('Error inicializando Firebase Admin:', error);
        return false;
      }
    } else {
      console.warn('Firebase Admin no inicializado: variables de entorno faltantes');
      return false;
    }
  }
  return true;
}

// Función para obtener Firestore de forma segura
function getFirestoreSafely() {
  if (initializeFirebaseAdmin()) {
    return getFirestore();
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const db = getFirestoreSafely();
    
    // Verificar que Firebase Admin esté inicializado
    if (!db) {
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