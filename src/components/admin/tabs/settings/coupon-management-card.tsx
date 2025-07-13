"use client";

import { useState } from 'react';
import type { Coupon } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Pencil, Trash2, Loader2, CreditCard, Percent, DollarSign } from 'lucide-react';
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
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
        setIsSaving(true);
        
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
            setIsSaving(false);
            return;
        }

        try {
            if (editingCoupon) {
                await onUpdateCoupon(editingCoupon.id, { ...result.data, id: editingCoupon.id });
                toast({ title: 'Cupón actualizado', description: 'Los cambios han sido guardados exitosamente.' });
            } else {
                await onAddCoupon(result.data);
                toast({ title: 'Cupón añadido', description: 'El cupón ha sido creado exitosamente.' });
            }
            setIsDialogOpen(false);
            setEditingCoupon(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el cupón.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        
        try {
            await onDeleteCoupon(itemToDelete.id);
            toast({ title: 'Cupón eliminado', description: 'El cupón ha sido eliminado exitosamente.' });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el cupón.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const getDiscountIcon = (type: 'fixed' | 'percentage') => {
        return type === 'fixed' ? <DollarSign className="h-4 w-4" /> : <Percent className="h-4 w-4" />;
    };

    const getDiscountLabel = (type: 'fixed' | 'percentage') => {
        return type === 'fixed' ? 'Monto Fijo' : 'Porcentaje';
    };

    return (
        <>
            <Card className="border-primary/10">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Cupones de Descuento
                            </CardTitle>
                            <CardDescription className="text-base">
                                Gestiona los cupones para pacientes y médicos.
                            </CardDescription>
                        </div>
                        <Button onClick={() => openDialog(null)} className="shrink-0 w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Añadir Cupón
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {/* Vista móvil mejorada */}
                    <div className="md:hidden space-y-3">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Código:</span>
                                            <span className="text-sm font-bold font-mono">{coupon.code}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                {getDiscountIcon(coupon.discountType)}
                                                {getDiscountLabel(coupon.discountType)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Valor:</span>
                                            <span className="text-sm font-bold">
                                                {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Alcance:</span>
                                            <span className="text-sm font-medium truncate ml-2">{coupon.scope}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => openDialog(coupon)}
                                        className="h-8 px-3"
                                    >
                                        <Pencil className="h-3 w-3 mr-1"/>
                                        Editar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => openDeleteDialog(coupon)}
                                        className="h-8 px-3 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1"/>
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))}
                        
                        {coupons.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="h-8 w-8 mx-auto mb-2" />
                                <p>No hay cupones creados</p>
                                <p className="text-sm">Comienza añadiendo el primer cupón</p>
                            </div>
                        )}
                    </div>

                    {/* Tabla responsiva para desktop */}
                    <div className="hidden md:block rounded-md border">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Alcance</TableHead>
                                        <TableHead className="w-24 text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map(coupon => (
                                        <TableRow key={coupon.id} className="hover:bg-muted/50">
                                            <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                    {getDiscountIcon(coupon.discountType)}
                                                    {getDiscountLabel(coupon.discountType)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {coupon.discountType === 'fixed' ? `$${coupon.value}` : `${coupon.value}%`}
                                            </TableCell>
                                            <TableCell>{coupon.scope}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => openDialog(coupon)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-3 w-3"/>
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => openDeleteDialog(coupon)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3 w-3"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {coupons.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="h-8 w-8 mx-auto mb-2" />
                                <p>No hay cupones creados</p>
                                <p className="text-sm">Comienza añadiendo el primer cupón</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Diálogo de edición/creación mejorado */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-sm font-medium">
                                Código del Cupón <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="code" 
                                name="code" 
                                defaultValue={editingCoupon?.code} 
                                required 
                                placeholder="Ej: DESCUENTO20"
                                className="h-10 font-mono"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="discountType" className="text-sm font-medium">
                                Tipo de Descuento <span className="text-red-500">*</span>
                            </Label>
                            <Select name="discountType" defaultValue={editingCoupon?.discountType || 'fixed'}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Monto Fijo ($)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="percentage">
                                        <div className="flex items-center gap-2">
                                            <Percent className="h-4 w-4" />
                                            Porcentaje (%)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-sm font-medium">
                                Valor del Descuento <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="value" 
                                name="value" 
                                type="number" 
                                defaultValue={editingCoupon?.value} 
                                required 
                                placeholder="0.00"
                                className="h-10"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="scope" className="text-sm font-medium">
                                Alcance <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="scope" 
                                name="scope" 
                                defaultValue={editingCoupon?.scope || 'general'} 
                                required 
                                placeholder="general o ID del médico"
                                className="h-10"
                            />
                        </div>
                        
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="w-full sm:w-auto">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación de eliminación mejorado */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar este cupón? 
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={isDeleting}
                            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
