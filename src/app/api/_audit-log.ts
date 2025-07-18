import { getFirestore } from 'firebase-admin/firestore';

export async function saveAuditLog({ userId, email, role, ip, action, details, result, message }: {
  userId: string;
  email?: string;
  role?: string;
  ip?: string;
  action: string;
  details?: unknown;
  result: 'success' | 'error';
  message?: string;
}) {
  try {
    const db = getFirestore();
    await db.collection('auditLogs').add({
      userId,
      email: email || null,
      role: role || null,
      ip: ip || null,
      action,
      details: details || null,
      result,
      message: message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Error guardando log de auditoría:', e);
  }
} 