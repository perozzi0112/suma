
"use client";

import type { Coupon } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface CouponsTabProps {
  coupons: Coupon[];
  onOpenDialog: (coupon: Coupon | null) => void;
  onDeleteItem: (type: 'coupon', id: string) => void;
}

export function CouponsTab({ coupons, onOpenDialog, onDeleteItem }: CouponsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mis Cupones</CardTitle>
        <Button onClick={() => onOpenDialog(null)}>
          <PlusCircle className="mr-2"/>Añadir Cupón
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length > 0 ? coupons.map(coupon => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                <TableCell className="capitalize">
                  {coupon.discountType === 'fixed' ? 'Monto Fijo' : 'Porcentaje'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => onOpenDialog(coupon)}>
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDeleteItem('coupon', coupon.id)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No has creado cupones.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
