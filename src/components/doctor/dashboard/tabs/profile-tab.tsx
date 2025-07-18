
"use client";

import { useState } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as firestoreService from '@/lib/firestoreService';
import type { Doctor } from '@/lib/types';
import { } from 'lucide-react';
import Image from 'next/image';

const DoctorProfileSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  cedula: z.string().min(1, "La cédula es requerida."),
  whatsapp: z.string().optional(),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  sector: z.string().min(1, "El sector es requerido."),
  consultationFee: z.preprocess((val) => Number(val), z.number().min(0, "La tarifa no puede ser negativa.")),
  slotDuration: z.preprocess((val) => Number(val), z.number().int().min(5, "La duración debe ser al menos 5 min.").positive()),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

interface ProfileTabProps {
  doctorData: Doctor;
  onProfileUpdate: () => void;
  // onPasswordChange eliminado porque no se usa
  onOpenPasswordDialog: () => void;
}

// Función para comprimir imagen antes de convertir a base64
const compressImage = (file: File, maxSizeKB: number = 100): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      const maxDimension = maxSizeKB > 200 ? 800 : 400; // Dimensiones máximas
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convertir a base64 con calidad reducida
      const quality = maxSizeKB > 200 ? 0.7 : 0.8;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Si aún es muy grande, reducir más la calidad
      if (dataUrl.length > maxSizeKB * 1024) {
        const reducedQuality = quality * 0.8;
        const reducedDataUrl = canvas.toDataURL('image/jpeg', reducedQuality);
        resolve(reducedDataUrl);
      } else {
        resolve(dataUrl);
      }
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const fileToDataUri = async (file: File): Promise<string> => {
  // Comprimir imagen antes de convertir
  const maxSizeKB = file.name.includes('banner') ? 200 : 100; // Banner puede ser más grande
  return await compressImage(file, maxSizeKB);
};

export function ProfileTab({ doctorData, onProfileUpdate, onOpenPasswordDialog }: ProfileTabProps) {
  const { toast } = useToast();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorData) return;
    
    try {
      const formData = new FormData(e.currentTarget);
      const dataToValidate = {
        name: formData.get('name') as string,
        cedula: formData.get('cedula') as string,
        whatsapp: formData.get('whatsapp') as string,
        address: formData.get('address') as string,
        sector: formData.get('sector') as string,
        consultationFee: formData.get('consultationFee') as string,
        slotDuration: formData.get('slotDuration') as string,
        description: formData.get('description') as string,
      };

      const result = DoctorProfileSchema.safeParse(dataToValidate);
      if (!result.success) {
          toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
          return;
      }
      
      let profileImageUrl = doctorData.profileImage;
      if (profileImageFile) { 
          profileImageUrl = await fileToDataUri(profileImageFile);
      }
      
      let bannerImageUrl = doctorData.bannerImage;
      if (bannerImageFile) {
          bannerImageUrl = await fileToDataUri(bannerImageFile);
      }

      await firestoreService.updateDoctor(doctorData.id, {...result.data, profileImage: profileImageUrl, bannerImage: bannerImageUrl});
      toast({ title: 'Perfil Actualizado' });
      onProfileUpdate();
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      // Si el error es por tamaño del documento, intentar limpiar datos
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : '';
      const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : '';
      if ((typeof message === 'string' && message.includes('size')) || code === 'resource-exhausted') {
        toast({ 
          variant: 'destructive', 
          title: 'Error de Tamaño', 
          description: 'El documento es muy grande. Se intentará limpiar datos antiguos automáticamente.' 
        });
        
        try {
          await firestoreService.cleanupDoctorData(doctorData.id);
          toast({ title: 'Datos Limpiados', description: 'Se han limpiado datos antiguos. Intenta guardar nuevamente.' });
          onProfileUpdate(); // Refrescar datos
        } catch {
          toast({ 
            variant: 'destructive', 
            title: 'Error Crítico', 
            description: 'No se pudo limpiar el documento. Contacta al administrador.' 
          });
        }
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'No se pudo actualizar el perfil. Intenta nuevamente.' 
        });
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-2xl">Perfil Público</CardTitle>
          <CardDescription className="text-xs md:text-base">Esta información será visible para los pacientes.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2"><Label htmlFor="name" className="text-xs md:text-sm">Nombre Completo</Label><Input id="name" name="name" defaultValue={doctorData.name} className="h-9 md:h-10 text-xs md:text-sm" /></div>
              <div className="space-y-1 md:space-y-2"><Label htmlFor="cedula" className="text-xs md:text-sm">Cédula</Label><Input id="cedula" name="cedula" defaultValue={doctorData.cedula} className="h-9 md:h-10 text-xs md:text-sm" /></div>
            </div>
            <div className="space-y-1 md:space-y-2"><Label htmlFor="whatsapp" className="text-xs md:text-sm">Nro. WhatsApp</Label><Input id="whatsapp" name="whatsapp" defaultValue={doctorData.whatsapp} className="h-9 md:h-10 text-xs md:text-sm" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2"><Label htmlFor="address" className="text-xs md:text-sm">Dirección</Label><Input id="address" name="address" defaultValue={doctorData.address} className="h-9 md:h-10 text-xs md:text-sm" /></div>
              <div className="space-y-1 md:space-y-2"><Label htmlFor="sector" className="text-xs md:text-sm">Sector</Label><Input id="sector" name="sector" defaultValue={doctorData.sector} className="h-9 md:h-10 text-xs md:text-sm" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2"><Label htmlFor="consultationFee" className="text-xs md:text-sm">Tarifa Consulta ($)</Label><Input id="consultationFee" name="consultationFee" type="number" defaultValue={doctorData.consultationFee} className="h-9 md:h-10 text-xs md:text-sm" /></div>
              <div className="space-y-1 md:space-y-2"><Label htmlFor="slotDuration" className="text-xs md:text-sm">Duración Cita (min)</Label><Input id="slotDuration" name="slotDuration" type="number" defaultValue={doctorData.slotDuration} className="h-9 md:h-10 text-xs md:text-sm" /></div>
            </div>
            <div className="space-y-1 md:space-y-2"><Label htmlFor="description" className="text-xs md:text-sm">Descripción Profesional</Label><Textarea id="description" name="description" defaultValue={doctorData.description} rows={4} className="text-xs md:text-sm"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-1 md:space-y-2"><Label className="text-xs md:text-sm">Foto de Perfil</Label><Image src={profileImageFile ? URL.createObjectURL(profileImageFile) : doctorData.profileImage} alt="Perfil" width={80} height={80} className="rounded-full border w-20 h-20 md:w-[100px] md:h-[100px] object-cover" /><Input type="file" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} className="text-xs md:text-sm" /></div>
              <div className="space-y-1 md:space-y-2"><Label className="text-xs md:text-sm">Imagen de Banner</Label><Image src={bannerImageFile ? URL.createObjectURL(bannerImageFile) : doctorData.bannerImage} alt="Banner" width={200} height={60} className="rounded-md border aspect-video object-cover w-full max-w-xs md:max-w-full" /><Input type="file" onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)} className="text-xs md:text-sm" /></div>
            </div>
          </CardContent>
          <CardFooter><Button type="submit" className="w-full md:w-auto">Guardar Perfil</Button></CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base md:text-2xl">Seguridad</CardTitle><CardDescription className="text-xs md:text-base">Cambia tu contraseña.</CardDescription></CardHeader>
        <CardContent>
          <Button onClick={onOpenPasswordDialog} className="w-full md:w-auto">Cambiar Contraseña</Button>
        </CardContent>
      </Card>
    </div>
  );
}
