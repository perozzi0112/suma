"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center text-foreground">
      <AlertTriangle className="mb-8 h-24 w-24 text-primary" />
      <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
        404 - Página No Encontrada
      </h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Button asChild>
        <Link href="/">Volver a la Página de Inicio</Link>
      </Button>
    </div>
  );
}
