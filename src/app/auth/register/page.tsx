"use client";

import { useState } from 'react';
import Link from "next/link";
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Stethoscope, Loader2 } from "lucide-react";
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/settings';
import Image from 'next/image';
import { validateEmail, validatePassword, validateName } from '@/lib/validation-utils';


const RegisterSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido."),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
    .regex(/[a-z]/, "Debe contener al menos una minúscula.")
    .regex(/[0-9]/, "Debe contener al menos un número."),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const { logoUrl } = useSettings();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Sanitizar y validar antes de zod
    const nameSan = validateName(fullName);
    const emailSan = validateEmail(email);
    const passSan = validatePassword(password);
    if (!nameSan.isValid || !emailSan.isValid || !passSan.isValid) {
      toast({ variant: 'destructive', title: 'Error de Registro', description: 'Datos inválidos o peligrosos.' });
      setIsLoading(false);
      return;
    }
    
    const result = RegisterSchema.safeParse({ fullName: nameSan.sanitized, email: emailSan.sanitized, password, confirmPassword });
    
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(' ');
      toast({ variant: 'destructive', title: 'Error de Registro', description: errorMessage });
      setIsLoading(false);
      return;
    }
    
    try {
      await register(nameSan.sanitized, emailSan.sanitized, password);
    } catch {
       toast({ variant: 'destructive', title: 'Error', description: "Ocurrió un error inesperado durante el registro." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          {logoUrl ? (
            <div className="mx-auto mb-4 h-16 flex items-center">
              <Image 
                src={logoUrl} 
                alt="SUMA Logo" 
                width={160} 
                height={60} 
                className="object-contain"
                data-ai-hint="logo"
              />
            </div>
          ) : (
            <div className="inline-block mx-auto mb-4">
              <Stethoscope className="h-10 w-10 text-primary" />
            </div>
          )}
          <CardTitle className="text-2xl font-headline">
            Registro de Paciente
          </CardTitle>
          <CardDescription>
            Ingresa tu información para crear una cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Nombre Completo</Label>
                <Input
                  id="full-name"
                  placeholder="Juan Perez"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                 <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear una cuenta
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="underline">
              Inicia sesión
            </Link>
          </div>
          <Separator className="my-4" />
          <Button variant="ghost" asChild className="w-full text-muted-foreground">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la página de inicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
