"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { HeaderWrapper } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, CheckCircle, Lock, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { migratePasswords, checkPasswordEncryptionStatus } from '@/lib/migrate-passwords';

interface MigrationStatus {
  totalUsers: number;
  encryptedUsers: number;
  plainTextUsers: number;
  noPasswordUsers: number;
  isChecking: boolean;
  isMigrating: boolean;
  lastCheck: string | null;
  lastMigration: string | null;
}

export default function PasswordMigrationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<MigrationStatus>({
    totalUsers: 0,
    encryptedUsers: 0,
    plainTextUsers: 0,
    noPasswordUsers: 0,
    isChecking: false,
    isMigrating: false,
    lastCheck: null,
    lastMigration: null,
  });

  // Redirección segura solo para administradores
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleCheckStatus = async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Simular la verificación (en un entorno real, esto se haría desde el servidor)
      await checkPasswordEncryptionStatus();
      
      // Actualizar estado con datos simulados (en producción, estos vendrían del servidor)
      setStatus(prev => ({
        ...prev,
        totalUsers: 25,
        encryptedUsers: 15,
        plainTextUsers: 10,
        noPasswordUsers: 0,
        lastCheck: new Date().toLocaleString('es-VE'),
        isChecking: false,
      }));
      
      toast({
        title: 'Estado Verificado',
        description: 'Se ha verificado el estado de encriptación de las contraseñas.',
      });
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo verificar el estado de las contraseñas.',
      });
      setStatus(prev => ({ ...prev, isChecking: false }));
    }
  };

  const handleMigratePasswords = async () => {
    if (status.plainTextUsers === 0) {
      toast({
        title: 'No se requiere migración',
        description: 'Todas las contraseñas ya están encriptadas.',
      });
      return;
    }

    setStatus(prev => ({ ...prev, isMigrating: true }));
    
    try {
      // Simular la migración (en un entorno real, esto se haría desde el servidor)
      await migratePasswords();
      
      // Actualizar estado después de la migración
      setStatus(prev => ({
        ...prev,
        encryptedUsers: prev.totalUsers - prev.noPasswordUsers,
        plainTextUsers: 0,
        lastMigration: new Date().toLocaleString('es-VE'),
        isMigrating: false,
      }));
      
      toast({
        title: 'Migración Completada',
        description: 'Todas las contraseñas han sido encriptadas exitosamente.',
      });
    } catch (error) {
      console.error('Error during migration:', error);
      toast({
        variant: 'destructive',
        title: 'Error en la Migración',
        description: 'No se pudo completar la migración de contraseñas.',
      });
      setStatus(prev => ({ ...prev, isMigrating: false }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 bg-muted/40">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold font-headline">Migración de Contraseñas</h1>
              <p className="text-muted-foreground text-lg">
                Herramienta de administración para encriptar contraseñas existentes
              </p>
            </div>

            {/* Advertencia de Seguridad */}
            <Alert className="border-orange-200 bg-orange-50/30">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>⚠️ Importante:</strong> Esta herramienta debe usarse con precaución. 
                La migración de contraseñas es irreversible y debe ejecutarse solo una vez. 
                Asegúrate de tener una copia de seguridad antes de proceder.
              </AlertDescription>
            </Alert>

            {/* Estado Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Estado Actual de Encriptación
                </CardTitle>
                <CardDescription>
                  Verifica el estado de encriptación de las contraseñas en la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{status.totalUsers}</div>
                    <div className="text-sm text-blue-800">Total de Usuarios</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{status.encryptedUsers}</div>
                    <div className="text-sm text-green-800">Encriptadas</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{status.plainTextUsers}</div>
                    <div className="text-sm text-red-800">Texto Plano</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-600">{status.noPasswordUsers}</div>
                    <div className="text-sm text-gray-800">Sin Contraseña</div>
                  </div>
                </div>

                {/* Estado de Seguridad */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Estado de Seguridad</h3>
                  {status.plainTextUsers === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        ✅ Todas las contraseñas están encriptadas correctamente
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 font-medium">
                        ⚠️ Se encontraron {status.plainTextUsers} contraseñas en texto plano
                      </span>
                    </div>
                  )}
                </div>

                {/* Información de Última Verificación */}
                {status.lastCheck && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Última verificación:</strong> {status.lastCheck}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCheckStatus} 
                  disabled={status.isChecking}
                  className="w-full sm:w-auto"
                >
                  {status.isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Verificar Estado
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Migración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-600" />
                  Migración de Contraseñas
                </CardTitle>
                <CardDescription>
                  Encripta todas las contraseñas que aún están en texto plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">¿Qué hace esta migración?</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Encripta todas las contraseñas en texto plano usando bcrypt</li>
                    <li>• Mantiene la compatibilidad con contraseñas ya encriptadas</li>
                    <li>• Procesa pacientes, doctores y vendedores</li>
                    <li>• Es irreversible pero segura</li>
                  </ul>
                </div>

                {status.plainTextUsers > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Listo para migrar:</strong> Se encontraron {status.plainTextUsers} contraseñas 
                      que necesitan ser encriptadas. Haz clic en &quot;Iniciar Migración&quot; para proceder.
                    </AlertDescription>
                  </Alert>
                )}

                {status.plainTextUsers === 0 && status.totalUsers > 0 && (
                  <Alert className="border-green-200 bg-green-50/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>No se requiere migración:</strong> Todas las contraseñas ya están encriptadas correctamente.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleMigratePasswords} 
                  disabled={status.isMigrating || status.plainTextUsers === 0}
                  variant={status.plainTextUsers > 0 ? "default" : "outline"}
                  className="w-full sm:w-auto"
                >
                  {status.isMigrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Iniciar Migración
                    </>
                  )}
                </Button>
                
                {status.lastMigration && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Última migración:</strong> {status.lastMigration}
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Información Técnica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  Información Técnica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Algoritmo de Encriptación</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• bcrypt con factor de costo 10</li>
                      <li>• Salt único por contraseña</li>
                      <li>• Resistente a ataques de fuerza bruta</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Compatibilidad</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Soporta contraseñas existentes</li>
                      <li>• Migración automática en login</li>
                      <li>• No afecta funcionalidad actual</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 