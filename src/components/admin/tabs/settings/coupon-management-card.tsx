"use client";

import { useState } from 'react';
import type { Coupon } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { z } from 'zod';

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código es requerido.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.preprocess((val) => Number(val), z.number().positive("El valor debe ser positivo.")),
  scope: z.string(),
});

interface CouponManagementCardProps {
    coupons: Coupon[];
    onAddCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<void>;
    onUpdateCoupon: (id: string, coupon: Coupon) => Promise<void>;
    onDeleteCoupon: (id: string) => Promise<void>;
}

export function CouponManagementCard({ coupons, onAddCoupon, onUpdateCoupon, onDeleteCoupon }: CouponManagementCardProps) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Coupon | null>(null);

    const openDialog = (item: Coupon | null) => {
        setEditingCoupon(item);
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (item: Coupon) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            code: formData.get('code') as string,
            discountType: formData.get('discountType') as 'fixed' | 'percentage',
            value: formData.get('value') as string,
            scope: formData.get('scope') as string,
        };
        const result = CouponFormSchema.safeParse(data);

        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(e => e.message).join(' ') });
            return;
        }

        try {
            if (editingCoupon) {
                await onUpdateCoupon(editingCoupon.id, { ...result.data, id: editingCoupon.id });
                toast({ title: 'Cupón actualizado' });
            } else {
                await onAddCoupon(result.data);
                toast({ title: 'Cupón añadido' });
            }
            setIsDialogOpen(false);
            setEditingCoupon(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el cupón.' });
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await onDeleteCoupon(itemToDelete.id);
            toast({ title: 'Cupón eliminado' });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el cupón.' });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Cupones de Descuento</CardTitle>
                        <CardDescription>Gestiona los cupones para pacientes y médicos.</CardDescription>
                    </div>
                    <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Cupón</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Alcance</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {coupons.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell>{c.code}</TableCell>
                                    <TableCell className="capitalize">{c.discountType === 'fixed' ? 'Monto Fijo' : 'Porcentaje'}</TableCell>
                                    <TableCell>{c.discountType === 'fixed' ? `$${c.value}` : `${c.value}%`}</TableCell>
                                    <TableCell>{c.scope}</TableCell>
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => openDialog(c)}><Pencil className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(c)}><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {coupons.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay cupones creados.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div><Label>Código</Label><Input name="code" defaultValue={editingCoupon?.code} required/></div>
                        <div><Label>Tipo</Label><Select name="discountType" defaultValue={editingCoupon?.discountType || 'fixed'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fixed">Monto Fijo ($)</SelectItem><SelectItem value="percentage">Porcentaje (%)</SelectItem></SelectContent></Select></div>
                        <div><Label>Valor</Label><Input name="value" type="number" defaultValue={editingCoupon?.value} required/></div>
                        <div><Label>Alcance</Label><Input name="scope" defaultValue={editingCoupon?.scope || 'general'} required placeholder="general o ID del médico"/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente. ¿Seguro que quieres eliminar este cupón?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({variant: 'destructive'}))}>Sí, Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
