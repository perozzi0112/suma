"use client";

import { NotificationTest } from '@/components/notification-test';
import { HeaderWrapper } from '@/components/header';

export default function NotificationTestPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2">Prueba de Notificaciones</h1>
          <p className="text-muted-foreground">
            Esta página te permite verificar que las notificaciones estén funcionando correctamente para tu tipo de usuario.
          </p>
        </div>
        
        <NotificationTest />
        
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Información de Prueba</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Pacientes:</strong> Verán notificaciones de citas, pagos, mensajes y resúmenes clínicos</li>
            <li>• <strong>Doctores:</strong> Verán notificaciones de nuevas citas, pagos de suscripción y respuestas de soporte</li>
            <li>• <strong>Vendedores:</strong> Verán notificaciones de nuevos referidos, pagos de comisiones y respuestas de soporte</li>
            <li>• <strong>Administradores:</strong> Verán notificaciones de pagos pendientes, tickets de soporte y nuevos médicos</li>
          </ul>
        </div>
      </main>
    </div>
  );
} 