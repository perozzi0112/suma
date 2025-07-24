
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import * as firestoreService from '@/lib/firestoreService';
import { HeaderWrapper, BottomNav } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Lock, Camera, Upload, X } from 'lucide-react';
import { z } from 'zod';
import { useSettings } from '@/lib/settings';
import Image from 'next/image';
import { NotificationSettings } from '@/components/notification-settings';
import { validateName, validatePhone, validateCedula, validateCity, validateAge } from '@/lib/validation-utils';

const PatientProfileSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido."),
  age: z.number().int().positive("La edad debe ser un número positivo.").optional().nullable(),
  gender: z.enum(['masculino', 'femenino', 'otro', '']).optional().nullable(),
  cedula: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const countryCodes = [
  { code: '+58', name: 'Venezuela' },
  { code: '+1', name: 'Estados Unidos/Canadá' },
  { code: '+34', name: 'España' },
  { code: '+57', name: 'Colombia' },
  { code: '+54', name: 'Argentina' },
  { code: '+55', name: 'Brasil' },
  { code: '+51', name: 'Perú' },
  { code: '+52', name: 'México' },
  { code: '+56', name: 'Chile' },
  { code: '+53', name: 'Cuba' },
  // ...agrega más si lo deseas
];

export default function ProfilePage() {
  const { user, updateUser, changePassword } = useAuth();
  const { cities } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for profile info
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'masculino' | 'femenino' | 'otro' | ''>('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('+58');
  
  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/auth/login');
    } else {
      // Actualizar SIEMPRE los campos del formulario cuando el usuario cambie
      setFullName(user.name ?? '');
      setAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
      setGender(user.gender ?? '');
      setCedula(user.cedula ?? '');
      setCity(user.city ?? '');
      setProfileImage(user.profileImage ?? null);
      // Separar código de país y número si ya existe
      if (user.phone && user.phone.startsWith('+')) {
        const match = user.phone.match(/^(\+\d{1,4})(\d{7,15})$/);
        if (match) {
          setCountryCode(match[1]);
          setPhone(match[2]);
        } else {
          setCountryCode('+58');
          setPhone(user.phone);
        }
      } else {
        setCountryCode('+58');
        setPhone(user.phone ?? '');
      }
    }
  }, [user?.name, user?.age, user?.gender, user?.cedula, user?.phone, user?.city, user?.profileImage, user, router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de archivo no válido',
        description: 'Por favor selecciona una imagen (JPG, PNG, etc.)',
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Archivo demasiado grande',
        description: 'La imagen debe ser menor a 5MB',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSave = async () => {
    if (!profileImage || !user) return;

    setIsUploading(true);
    try {
      await updateUser({ profileImage });
      toast({
        title: 'Foto de perfil actualizada',
        description: 'Tu foto de perfil ha sido guardada correctamente.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la foto de perfil.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Sanitizar y validar antes de zod
    const nameSan = validateName(fullName);
    // Eliminar cero inicial si existe
    const phoneSanitized = phone && phone.startsWith('0') ? phone.slice(1) : phone;
    const fullPhone = phoneSanitized ? `${countryCode}${phoneSanitized}` : '';
    const phoneSan = validatePhone(fullPhone);
    const cedulaSan = validateCedula(cedula);
    const citySan = validateCity(city);
    const ageSan = validateAge(age);
    if (!nameSan.isValid || (cedula && !cedulaSan.isValid) || (phone && !phoneSan.isValid) || (city && !citySan.isValid) || (age && !ageSan.isValid)) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: 'Datos inválidos o peligrosos.' });
      return;
    }

    const parsedAge = age ? parseInt(age, 10) : null;
    const result = PatientProfileSchema.safeParse({
      fullName: nameSan.sanitized,
      age: parsedAge,
      gender,
      cedula: cedulaSan.sanitized,
      phone: phoneSan.sanitized,
      city: citySan.sanitized,
    });

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Error de Validación', description: errorMessage });
        return;
    }

    // No permitir cambiar la cédula si ya existe
    const finalCedula = user.cedula || result.data.cedula;

    await updateUser({
      name: result.data.fullName,
      age: result.data.age,
      gender: result.data.gender === '' ? null : result.data.gender,
      cedula: finalCedula, // Mantener la cédula original si ya existe
      phone: fullPhone,
      city: result.data.city,
    });

    // Refrescar usuario desde Firestore y actualizar estado global y localStorage
    const freshUser = await firestoreService.findUserByEmail(user.email);
    if (freshUser) {
      await updateUser(freshUser); // Actualiza el contexto
      localStorage.setItem('user', JSON.stringify(freshUser));
    }
    
    toast({
        title: "¡Perfil Actualizado!",
        description: "Tu información personal ha sido guardada correctamente.",
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = PasswordChangeSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
    });

    if (!result.success) {
        const errorMessage = result.error.errors.map(err => err.message).join(' ');
        toast({ variant: 'destructive', title: 'Error de Validación', description: errorMessage });
        return;
    }

    const { success, message } = await changePassword(
        result.data.currentPassword,
        result.data.newPassword
    );

    if (success) {
        toast({ title: 'Éxito', description: message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: message });
    }
  };


  if (!user) {
    // You can return a loading skeleton here
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center">
            <p>Cargando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 flex items-center justify-center py-12 bg-muted/40 pb-20 md:pb-12">
        <div className="container max-w-2xl space-y-8">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Camera /> Foto de Perfil
              </CardTitle>
              <CardDescription>
                Personaliza tu foto de perfil para que los médicos te reconozcan mejor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Preview de la imagen */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Foto de perfil"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Botón para remover imagen */}
                  {profileImage && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
                      onClick={removeProfileImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Controles de subida */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Elegir Foto
                  </Button>
                  
                  {profileImage && (
                    <Button
                      onClick={handleImageSave}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Input oculto para subir archivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Información de ayuda */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Formatos soportados: JPG, PNG, GIF</p>
                  <p>Tamaño máximo: 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <User /> Mi Perfil
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={user.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <Input
                      id="cedula"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="ej., V-12345678"
                      disabled={!!user?.cedula} // Deshabilitar si ya tiene cédula
                    />
                    {user?.cedula && (
                      <p className="text-xs text-muted-foreground">
                        La cédula no se puede modificar después del registro
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.startsWith('0')) val = val.slice(1);
                          setPhone(val);
                        }}
                        placeholder="Ej: 4121234567"
                        maxLength={15}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingresa solo números, sin el código de país. Ejemplo para Venezuela: <span className="font-mono">4121234567</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Edad</Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="ej., 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Sexo</Label>
                    <Select value={gender} onValueChange={(value) => setGender(value as 'masculino' | 'femenino' | 'otro')}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecciona tu sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad Predeterminada</Label>
                  <Select value={city} onValueChange={(value) => setCity(value as string)}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Selecciona tu ciudad para búsquedas" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Lock /> Seguridad
              </CardTitle>
              <CardDescription>
                Cambia tu contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sección de Notificaciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            <NotificationSettings 
              userId={user?.id || ''} 
            />
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
