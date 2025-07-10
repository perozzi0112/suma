
"use client";

import type { Service } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface ServicesTabProps {
  services: Service[];
  onOpenDialog: (service: Service | null) => void;
  onDeleteItem: (type: 'service', id: string) => void;
}

export function ServicesTab({ services, onOpenDialog, onDeleteItem }: ServicesTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mis Servicios</CardTitle>
        <Button onClick={() => onOpenDialog(null)}>
          <PlusCircle className="mr-2"/>Añadir Servicio
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Servicio</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length > 0 ? services.map(service => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-right font-mono">${service.price.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => onOpenDialog(service)}>
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDeleteItem('service', service.id)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">No has registrado servicios adicionales.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
