
"use client";

import type { BankDetail } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface BankDetailsTabProps {
  bankDetails: BankDetail[];
  onOpenDialog: (detail: BankDetail | null) => void;
  onDeleteItem: (type: 'bank', id: string) => void;
}

export function BankDetailsTab({ bankDetails, onOpenDialog, onDeleteItem }: BankDetailsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mis Cuentas Bancarias</CardTitle>
        <Button onClick={() => onOpenDialog(null)}>
          <PlusCircle className="mr-2"/>Añadir Cuenta
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banco</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead className="text-right">Número de Cuenta</TableHead>
              <TableHead className="text-center w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankDetails.length > 0 ? bankDetails.map(bd => (
              <TableRow key={bd.id}>
                <TableCell className="font-medium">{bd.bank}</TableCell>
                <TableCell>{bd.accountHolder}</TableCell>
                <TableCell className="text-right font-mono">{bd.accountNumber}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => onOpenDialog(bd)}>
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDeleteItem('bank', bd.id)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No has registrado cuentas bancarias.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
