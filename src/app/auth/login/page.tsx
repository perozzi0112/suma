"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
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
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/lib/settings";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";


const LoginSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export default function LoginPage() {
  const { login, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const { logoUrl } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = LoginSchema.safeParse({ email, password });
    
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(' ');
      toast({ variant: 'destructive', title: 'Error de Validación', description: errorMessage });
      setIsLoading(false);
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: "Ocurrió un error inesperado." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
      if (!resetEmail) {
          toast({ variant: 'destructive', title: 'Correo Requerido', description: 'Por favor, ingresa tu correo electrónico.' });
          return;
      }
      const emailValidation = z.string().email("Correo electrónico inválido.").safeParse(resetEmail);
      if (!emailValidation.success) {
          toast({ variant: 'destructive', title: 'Error de Validación', description: 'Por favor, ingresa un correo electrónico válido.' });
          return;
      }
      
      setIsResetLoading(true);
      await sendPasswordReset(resetEmail);
      setIsResetLoading(false);
      setIsResetDialogOpen(false);
      setResetEmail("");
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
          <CardTitle className="text-2xl font-headline">Bienvenido de Nuevo</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <form onSubmit={handleSubmit} className="grid gap-4">
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
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                   <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="link" type="button" className="ml-auto inline-block text-sm underline h-auto p-0">
                            ¿Olvidaste tu contraseña?
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Restablecer Contraseña</DialogTitle>
                            <DialogDescription>
                                Ingresa tu correo electrónico y te enviaremos un enlace para que puedas restablecer tu contraseña.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Correo Electrónico</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    disabled={isResetLoading}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="button" onClick={handleResetPassword} disabled={isResetLoading}>
                                {isResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Correo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </div>
          
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/auth/register" className="underline">
              Regístrate
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
