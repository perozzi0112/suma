"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { useDoctorNotifications } from '@/lib/doctor-notifications';
import { useSellerNotifications } from '@/lib/seller-notifications';
import { useAdminNotifications } from '@/lib/admin-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bell, CheckCircle } from 'lucide-react';

export function NotificationTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, unknown>>({});

  // Hooks de notificaciones
  const patientNotifications = useNotifications();
  const doctorNotifications = useDoctorNotifications();
  const sellerNotifications = useSellerNotifications();
  const adminNotifications = useAdminNotifications();

  useEffect(() => {
    if (!user) return;

    const results: Record<string, unknown> = {
      userRole: user.role,
      userId: user.id,
      timestamp: new Date().toISOString(),
      notifications: {}
    };

    // Verificar notificaciones según el rol
    switch (user.role) {
      case 'patient':
        results.notifications = {
          count: patientNotifications.notifications.length,
          unreadCount: patientNotifications.unreadCount,
          types: patientNotifications.notifications.map(n => n.type),
          latest: patientNotifications.notifications[0] || null
        };
        break;
      case 'doctor':
        results.notifications = {
          count: doctorNotifications.doctorNotifications.length,
          unreadCount: doctorNotifications.doctorUnreadCount,
          types: doctorNotifications.doctorNotifications.map(n => n.type),
          latest: doctorNotifications.doctorNotifications[0] || null
        };
        break;
      case 'seller':
        results.notifications = {
          count: sellerNotifications.sellerNotifications.length,
          unreadCount: sellerNotifications.sellerUnreadCount,
          types: sellerNotifications.sellerNotifications.map(n => n.type),
          latest: sellerNotifications.sellerNotifications[0] || null
        };
        break;
      case 'admin':
        results.notifications = {
          count: adminNotifications.adminNotifications.length,
          unreadCount: adminNotifications.adminUnreadCount,
          types: adminNotifications.adminNotifications.map(n => n.type),
          latest: adminNotifications.adminNotifications[0] || null
        };
        break;
    }

    setTestResults(results);
  }, [user, patientNotifications, doctorNotifications, sellerNotifications, adminNotifications]);

  const getNotificationHook = () => {
    switch (user?.role) {
      case 'patient': return patientNotifications;
      case 'doctor': return doctorNotifications;
      case 'seller': return sellerNotifications;
      case 'admin': return adminNotifications;
      default: return null;
    }
  };

  const handleMarkAsRead = () => {
    const hook = getNotificationHook();
    if (hook) {
      switch (user?.role) {
        case 'patient':
          if ('markAllAsRead' in hook) hook.markAllAsRead();
          break;
        case 'doctor':
          if ('markDoctorNotificationsAsRead' in hook) hook.markDoctorNotificationsAsRead();
          break;
        case 'seller':
          if ('markSellerNotificationsAsRead' in hook) hook.markSellerNotificationsAsRead();
          break;
        case 'admin':
          if ('markAdminNotificationsAsRead' in hook) hook.markAdminNotificationsAsRead();
          break;
      }
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Prueba de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Debes iniciar sesión para ver las notificaciones.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          Prueba de Notificaciones - {user.role}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Total de Notificaciones:</p>
            <Badge variant="outline" className="text-lg">
              {(testResults.notifications as { count?: number })?.count || 0}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">No Leídas:</p>
            <Badge variant={((testResults.notifications as { unreadCount?: number })?.unreadCount || 0) > 0 ? "destructive" : "outline"} className="text-lg">
              {(testResults.notifications as { unreadCount?: number })?.unreadCount || 0}
            </Badge>
          </div>
        </div>

        {(testResults.notifications as { types?: string[] })?.types && ((testResults.notifications as { types?: string[] }).types?.length || 0) > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tipos de Notificaciones:</p>
            <div className="flex flex-wrap gap-1">
              {(testResults.notifications as { types?: string[] }).types?.map((type: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(testResults.notifications as { latest?: { title: string; description: string; date: string } })?.latest && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Notificación Más Reciente:</p>
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="font-medium text-sm">{(testResults.notifications as { latest?: { title: string; description: string; date: string } }).latest?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(testResults.notifications as { latest?: { title: string; description: string; date: string } }).latest?.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date((testResults.notifications as { latest?: { title: string; description: string; date: string } }).latest?.date || '').toLocaleString('es-VE')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleMarkAsRead}
            disabled={!(testResults.notifications as { unreadCount?: number })?.unreadCount}
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar como Leídas
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Usuario ID:</strong> {testResults.userId as string}</p>
          <p><strong>Rol:</strong> {testResults.userRole as string}</p>
          <p><strong>Última actualización:</strong> {new Date(testResults.timestamp as string).toLocaleString('es-VE')}</p>
        </div>
      </CardContent>
    </Card>
  );
} 