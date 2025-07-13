'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  requestNotificationPermission, 
  isNotificationSupported, 
  hasNotificationPermission,
  sendPushNotification 
} from '@/lib/pushNotifications';

interface NotificationSettingsProps {
  userId: string;
  userRole: 'admin' | 'doctor' | 'patient' | 'seller';
}

export function NotificationSettings({ userId, userRole }: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    messages: true,
    systemNotifications: true,
    backgroundNotifications: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setHasPermission(hasNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        setHasPermission(true);
        
        // Guardar token en Firestore
        await fetch('/api/update-fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fcmToken: token }),
        });
        
        toast({
          title: '✅ Notificaciones habilitadas',
          description: 'Ahora recibirás notificaciones push en tu dispositivo.',
        });
      } else {
        toast({
          title: '❌ Permisos denegados',
          description: 'Necesitas habilitar las notificaciones para recibir alertas importantes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudieron habilitar las notificaciones.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await sendPushNotification(
        userId,
        'system',
        '🧪 Notificación de prueba',
        'Esta es una notificación de prueba para verificar que todo funciona correctamente.',
        { test: 'true' }
      );
      
      if (success) {
        toast({
          title: '✅ Notificación enviada',
          description: 'Revisa tu dispositivo para ver la notificación de prueba.',
        });
      } else {
        toast({
          title: '❌ Error',
          description: 'No se pudo enviar la notificación de prueba.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
      toast({
        title: '❌ Error',
        description: 'Error al enviar notificación de prueba.',
        variant: 'destructive',
      });
    }
  };

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-red-500" />
            Notificaciones no soportadas
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push. Te recomendamos usar un navegador más reciente.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configuración de Notificaciones
        </CardTitle>
        <CardDescription>
          Gestiona las notificaciones push que recibirás en tu dispositivo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estado de permisos */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {hasPermission ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {hasPermission ? 'Notificaciones habilitadas' : 'Notificaciones deshabilitadas'}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasPermission 
                  ? 'Recibirás notificaciones push en tu dispositivo'
                  : 'Habilita las notificaciones para recibir alertas importantes'
                }
              </p>
            </div>
          </div>
          
          {!hasPermission && (
            <Button 
              onClick={handleRequestPermission} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Habilitando...' : 'Habilitar'}
            </Button>
          )}
        </div>

        {/* Configuración de tipos de notificación */}
        {hasPermission && (
          <>
            <div className="space-y-4">
              <h4 className="font-medium">Tipos de notificación</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appointment-reminders">Recordatorios de citas</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe recordatorios automáticos de tus citas médicas
                    </p>
                  </div>
                  <Switch
                    id="appointment-reminders"
                    checked={settings.appointmentReminders}
                    onCheckedChange={() => handleSettingChange('appointmentReminders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="messages">Mensajes</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones de mensajes entre usuarios
                    </p>
                  </div>
                  <Switch
                    id="messages"
                    checked={settings.messages}
                    onCheckedChange={() => handleSettingChange('messages')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-notifications">Notificaciones del sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas importantes del sistema y administración
                    </p>
                  </div>
                  <Switch
                    id="system-notifications"
                    checked={settings.systemNotifications}
                    onCheckedChange={() => handleSettingChange('systemNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="background-notifications">Notificaciones en segundo plano</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones incluso cuando la app está cerrada
                    </p>
                  </div>
                  <Switch
                    id="background-notifications"
                    checked={settings.backgroundNotifications}
                    onCheckedChange={() => handleSettingChange('backgroundNotifications')}
                  />
                </div>
              </div>
            </div>

            {/* Botón de prueba */}
            <div className="pt-4 border-t">
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                🧪 Enviar notificación de prueba
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 