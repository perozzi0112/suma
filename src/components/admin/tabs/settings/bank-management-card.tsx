"use client";

import { useState } from 'react';
import type { BankDetail } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { z } from 'zod';

const BankDetailFormSchema = z.object({
    bank: z.string().min(3, "El nombre del banco es requerido."),
    accountHolder: z.string().min(3, "El nombre del titular es requerido."),
    idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
    accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
    description: z.string().optional(),
});


interface BankManagementCardProps {
    bankDetails: BankDetail[];
    onAddBankDetail: (detail: Omit<BankDetail, 'id'>) => Promise<void>;
    onUpdateBankDetail: (id: string, detail: BankDetail) => Promise<void>;
    onDeleteBankDetail: (id: string) => Promise<void>;
}

export function BankManagementCard({ bankDetails, onAddBankDetail, onUpdateBankDetail, onDeleteBankDetail }: BankManagementCardProps) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<BankDetail | null>(null);
    
    const openDialog = (item: BankDetail | null) => {
        setEditingBankDetail(item);
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (item: BankDetail) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };
    
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            bank: formData.get('bankName') as string,
            accountHolder: formData.get('holderName') as string,
            idNumber: formData.get('idNumber') as string,
            accountNumber: formData.get('accountNumber') as string,
            description: formData.get('description') as string,
        };
        const result = BankDetailFormSchema.safeParse(data);
        if(!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ') });
            return;
        }

        try {
            if (editingBankDetail) {
                await onUpdateBankDetail(editingBankDetail.id, { ...result.data, id: editingBankDetail.id });
                toast({ title: 'Cuenta Actualizada'});
            } else {
                await onAddBankDetail(result.data);
                toast({ title: 'Cuenta Añadida'});
            }
            setIsDialogOpen(false);
            setEditingBankDetail(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la cuenta bancaria.' });
        }
    };
    
    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await onDeleteBankDetail(itemToDelete.id);
            toast({ title: 'Cuenta eliminada' });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cuenta.' });
        }
    };
    
    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Cuentas Bancarias de SUMA</CardTitle>
                        <CardDescription>Cuentas para recibir pagos de suscripciones.</CardDescription>
                    </div>
                    <Button onClick={() => openDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Cuenta</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Titular</TableHead><TableHead>Número</TableHead><TableHead className="w-24 text-center">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {bankDetails.map(b => (
                                <TableRow key={b.id}>
                                    <TableCell>{b.bank}</TableCell>
                                    <TableCell>{b.accountHolder}</TableCell>
                                    <TableCell>{b.accountNumber}</TableCell>
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => openDialog(b)}><Pencil className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(b)}><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {bankDetails.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay cuentas bancarias registradas.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingBankDetail ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div><Label>Banco</Label><Input name="bankName" defaultValue={editingBankDetail?.bank}/></div>
                        <div><Label>Titular</Label><Input name="holderName" defaultValue={editingBankDetail?.accountHolder}/></div>
                        <div><Label>CI/RIF</Label><Input name="idNumber" defaultValue={editingBankDetail?.idNumber}/></div>
                        <div><Label># Cuenta</Label><Input name="accountNumber" defaultValue={editingBankDetail?.accountNumber}/></div>
                        <div><Label>Descripción</Label><Input name="description" defaultValue={editingBankDetail?.description || ''}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente. ¿Seguro que quieres eliminar esta cuenta?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({variant: 'destructive'}))}>Sí, Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
