import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\n/g, '\n'),
      }),
    });
  }
}

export async function middleware(request: NextRequest) {
  // Permitir OPTIONS para CORS preflight
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Excluir rutas públicas si las hay (ejemplo: /api/public)
  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const idToken = authHeader.replace('Bearer ', '');

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    // Adjuntar usuario autenticado al request (Next.js no lo soporta nativo, pero se puede pasar por headers)
    request.headers.set('x-user-id', decoded.uid);
    request.headers.set('x-user-email', decoded.email || '');
    request.headers.set('x-user-role', decoded.role || '');
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
} 