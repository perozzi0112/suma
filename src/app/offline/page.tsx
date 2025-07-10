"use client";

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 text-center p-4">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold font-headline mb-2">Sin Conexión</h1>
      <p className="text-muted-foreground max-w-md">
        Parece que no tienes conexión a internet. Esta aplicación requiere una conexión para funcionar correctamente, aunque algunas páginas visitadas anteriormente pueden estar disponibles.
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Por favor, comprueba tu conexión y vuelve a intentarlo.
      </p>
    </div>
  );
}
