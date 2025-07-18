import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { rateLimit } from '../_rate-limit';
import { saveAuditLog } from '../_audit-log';

// Inicializar Firebase Admin si no está inicializado y las credenciales están disponibles
let messaging: ReturnType<typeof getMessaging> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

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
      
      messaging = getMessaging();
      db = getFirestore();
    } catch (error) {
      console.error('Error inicializando Firebase Admin:', error);
    }
  } else {
    console.warn('Firebase Admin no inicializado: variables de entorno faltantes');
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting combinado
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userId = request.headers.get('x-user-id') || 'anon';
  const key = `notif:${userId}:${ip}`;
  if (!rateLimit(key)) {
    return NextResponse.json({ error: 'Demasiadas peticiones, intenta más tarde.' }, { status: 429 });
  }
  // Validar autenticación y rol admin
  const userRole = request.headers.get('x-user-role');
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'No autorizado. Solo admin puede enviar notificaciones.' }, { status: 403 });
  }

  try {
    // Verificar que Firebase Admin esté inicializado
    if (!messaging || !db) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado' },
        { status: 500 }
      );
    }

    const { userId, type, title, body, data } = await request.json();

    console.log('📤 API: Enviando notificación:', { userId, type, title, body });

    // Obtener el token FCM del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log('⚠️ Usuario no tiene token FCM:', userId);
      return NextResponse.json(
        { error: 'Usuario no tiene token FCM' },
        { status: 400 }
      );
    }

    // Crear mensaje de notificación
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        type,
        userId,
        timestamp: new Date().toISOString(),
        ...data,
      },
      android: {
        notification: {
          icon: '/icon-192x192.png',
          color: '#2563eb',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: type,
          requireInteraction: true,
        },
        fcm_options: {
          link: '/dashboard',
        },
      },
    };

    // Enviar notificación
    const response = await messaging.send(message);
    
    console.log('✅ Notificación enviada exitosamente:', response);

    // Guardar notificación en Firestore
    await db.collection('notifications').add({
      userId,
      type,
      title,
      body,
      data,
      timestamp: new Date(),
      read: false,
      fcmMessageId: response,
    });

    await saveAuditLog({
      userId: request.headers.get('x-user-id') || 'anon',
      email: request.headers.get('x-user-email') || '',
      role: request.headers.get('x-user-role') || '',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      action: 'send-notification',
      details: { userId, type, title, body },
      result: 'success',
      message: 'Notificación enviada',
    });

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });

  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    await saveAuditLog({
      userId: request.headers.get('x-user-id') || 'anon',
      email: request.headers.get('x-user-email') || '',
      role: request.headers.get('x-user-role') || '',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      action: 'send-notification',
      details: {},
      result: 'error',
      message: String(error),
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 