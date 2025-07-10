
"use client";

import { useState } from 'react';
import type { Doctor } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';

const DoctorProfileSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  cedula: z.string().min(6, "La cédula es requerida.").optional().or(z.literal('')),
  whatsapp: z.string().min(10, "El WhatsApp es requerido.").optional().or(z.literal('')),
  address: z.string().min(5, "La dirección es requerida."),
  sector: z.string().min(3, "El sector es requerido."),
  consultationFee: z.preprocess((val) => Number(val), z.number().min(0, "La tarifa no puede ser negativa.")),
  slotDuration: z.preprocess((val) => Number(val), z.number().min(5, "La duración debe ser al menos 5 minutos.")),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

interface ProfileTabProps {
  doctorData: Doctor;
  onProfileUpdate: () => void;
  onPasswordChange: () => void;
}

export function ProfileTab({ doctorData, onProfileUpdate, onPasswordChange }: ProfileTabProps) {
  const { toast } = useToast();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorData) return;
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
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Perfil Público</CardTitle><CardDescription>Esta información será visible para los pacientes.</CardDescription></CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">Nombre Completo</Label><Input id="name" name="name" defaultValue={doctorData.name} /></div>
              <div className="space-y-2"><Label htmlFor="cedula">Cédula</Label><Input id="cedula" name="cedula" defaultValue={doctorData.cedula} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="whatsapp">Nro. WhatsApp</Label><Input id="whatsapp" name="whatsapp" defaultValue={doctorData.whatsapp} /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="address">Dirección</Label><Input id="address" name="address" defaultValue={doctorData.address} /></div>
              <div className="space-y-2"><Label htmlFor="sector">Sector</Label><Input id="sector" name="sector" defaultValue={doctorData.sector} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="consultationFee">Tarifa Consulta ($)</Label><Input id="consultationFee" name="consultationFee" type="number" defaultValue={doctorData.consultationFee} /></div>
              <div className="space-y-2"><Label htmlFor="slotDuration">Duración Cita (min)</Label><Input id="slotDuration" name="slotDuration" type="number" defaultValue={doctorData.slotDuration} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Descripción Profesional</Label><Textarea id="description" name="description" defaultValue={doctorData.description} rows={5}/></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2"><Label>Foto de Perfil</Label><Image src={profileImageFile ? URL.createObjectURL(profileImageFile) : doctorData.profileImage} alt="Perfil" width={100} height={100} className="rounded-full border" /><Input type="file" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} /></div>
              <div className="space-y-2"><Label>Imagen de Banner</Label><Image src={bannerImageFile ? URL.createObjectURL(bannerImageFile) : doctorData.bannerImage} alt="Banner" width={300} height={100} className="rounded-md border aspect-video object-cover" /><Input type="file" onChange={(e) => setBannerImageFile(e.target.files?.[0] || null)} /></div>
            </div>
          </CardContent>
          <CardFooter><Button type="submit">Guardar Perfil</Button></CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader><CardTitle>Seguridad</CardTitle><CardDescription>Cambia tu contraseña.</CardDescription></CardHeader>
        <CardContent><Button onClick={onPasswordChange}>Cambiar Contraseña</Button></CardContent>
      </Card>
    </div>
  );
}
