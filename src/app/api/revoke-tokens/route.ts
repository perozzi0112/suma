import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { rateLimit } from '../_rate-limit';
import { saveAuditLog } from '../_audit-log';

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

export async function POST(request: NextRequest) {
  // Rate limiting combinado
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userId = request.headers.get('x-user-id');
  const key = `revoke:${userId}:${ip}`;
  if (!rateLimit(key)) {
    return NextResponse.json({ error: 'Demasiadas peticiones, intenta más tarde.' }, { status: 429 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    await getAuth().revokeRefreshTokens(userId);
    await saveAuditLog({
      userId,
      email: request.headers.get('x-user-email') || '',
      role: request.headers.get('x-user-role') || '',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      action: 'revoke-tokens',
      details: {},
      result: 'success',
      message: 'Tokens revocados',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error al revocar tokens:', error);
    await saveAuditLog({
      userId: request.headers.get('x-user-id') || 'anon',
      email: request.headers.get('x-user-email') || '',
      role: request.headers.get('x-user-role') || '',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      action: 'revoke-tokens',
      details: {},
      result: 'error',
      message: String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 