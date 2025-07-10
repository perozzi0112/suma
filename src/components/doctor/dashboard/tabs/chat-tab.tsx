
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ChatTab() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Chat con Pacientes</CardTitle>
            <CardDescription>Aquí puedes comunicarte directamente con tus pacientes.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
            <p>Por favor, ve a la sección de "Citas" y selecciona una cita para iniciar un chat.</p>
        </CardContent>
    </Card>
  );
}
