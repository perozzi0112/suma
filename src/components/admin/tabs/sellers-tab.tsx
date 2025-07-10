
"use client";
import { useState, useCallback, useEffect } from "react";
import type { Seller, Doctor } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { UserPlus, Pencil, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from "@/lib/utils";

const SellerFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Correo electrónico inválido."),
  commissionRate: z.number().min(0).max(1),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
});

export function SellersTab() {
  const { toast } = useToast();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Seller | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sells, docs] = await Promise.all([
        firestoreService.getSellers(),
        firestoreService.getDoctors(),
      ]);
      setSellers(sells);
      setDoctors(docs);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos de las vendedoras.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteDialog = (seller: Seller) => {
    setItemToDelete(seller);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await firestoreService.deleteSeller(itemToDelete.id);
      toast({ title: "Vendedora Eliminada" });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo completar la operación.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };


  const handleSaveSeller = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      commissionRate: parseFloat(formData.get('commissionRate') as string),
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const result = SellerFormSchema.safeParse(dataToValidate);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
      return;
    }

    if (editingSeller) {
      await firestoreService.updateSeller(editingSeller.id, {
        name: result.data.name,
        email: result.data.email,
        commissionRate: result.data.commissionRate,
      });
      // Handle password change if needed
      toast({ title: "Vendedora Actualizada", description: "Los datos han sido guardados." });
    } else {
      if (!result.data.password) {
        toast({ variant: 'destructive', title: 'Contraseña Requerida', description: 'Debe establecer una contraseña para las nuevas vendedoras.' });
        return;
      }
      const existingUser = await firestoreService.findUserByEmail(result.data.email);
      if (existingUser) {
        toast({ variant: 'destructive', title: 'Correo ya registrado', description: 'Este correo electrónico ya está en uso por otro usuario.' });
        return;
      }
      
      const referralCode = `${result.data.name.substring(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

      const newSellerData: Omit<Seller, 'id'> = {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        commissionRate: result.data.commissionRate,
        referralCode: referralCode,
        phone: null,
        profileImage: 'https://placehold.co/400x400.png',
        bankDetails: [],
        expenses: [],
      };
      await firestoreService.addSeller(newSellerData);
      toast({ title: "Vendedora Registrada", description: `${result.data.name} ha sido añadida.` });
    }

    fetchData();
    setIsSellerDialogOpen(false);
    setEditingSeller(null);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Gestión de Vendedoras</CardTitle>
            <CardDescription>Visualiza, edita y gestiona las vendedoras de la plataforma.</CardDescription>
          </div>
          <Button onClick={() => { setEditingSeller(null); setIsSellerDialogOpen(true); }}>
            <UserPlus className="mr-2 h-4 w-4"/> Añadir Vendedora
          </Button>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Vendedora</TableHead><TableHead>Contacto</TableHead><TableHead>Código de Referido</TableHead><TableHead className="text-center"># de Referidos</TableHead><TableHead className="text-right">Comisión</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell className="font-mono">{seller.referralCode}</TableCell>
                    <TableCell className="text-center">{doctors.filter(d => d.sellerId === seller.id).length}</TableCell>
                    <TableCell className="text-right font-mono">{(seller.commissionRate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(seller)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-4 md:hidden">
            {sellers.map((seller) => (
              <div key={seller.id} className="p-4 border rounded-lg space-y-3">
                <div><p className="font-semibold">{seller.name}</p><p className="text-xs text-muted-foreground">{seller.email}</p></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Código Referido</p><p className="font-mono">{seller.referralCode}</p></div>
                  <div><p className="text-xs text-muted-foreground">Comisión</p><p className="font-mono">{(seller.commissionRate * 100).toFixed(0)}%</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground"># de Referidos</p><p>{doctors.filter(d => d.sellerId === seller.id).length}</p></div>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingSeller(seller); setIsSellerDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => openDeleteDialog(seller)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                </div>
              </div>
            ))}
            {sellers.length === 0 && <p className="text-center text-muted-foreground py-8">No hay vendedoras registradas.</p>}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isSellerDialogOpen} onOpenChange={setIsSellerDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSeller ? 'Editar Vendedora' : 'Añadir Nueva Vendedora'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveSeller}>
            <div className="space-y-4 py-4">
              <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" name="name" defaultValue={editingSeller?.name} required/></div>
              <div><Label htmlFor="email">Correo Electrónico</Label><Input id="email" name="email" type="email" defaultValue={editingSeller?.email} required/></div>
              <div><Label htmlFor="commissionRate">Tasa de Comisión (ej. 0.2 para 20%)</Label><Input id="commissionRate" name="commissionRate" type="number" step="0.01" defaultValue={editingSeller?.commissionRate || 0.2} required/></div>
              <div><Label htmlFor="password">Nueva Contraseña</Label><Input id="password" name="password" type="password" placeholder={editingSeller ? 'Dejar en blanco para no cambiar' : 'Requerido'} /></div>
              <div><Label htmlFor="confirmPassword">Confirmar Contraseña</Label><Input id="confirmPassword" name="confirmPassword" type="password"/></div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro que deseas eliminar?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción es permanente y no se puede deshacer. Se eliminará a {itemToDelete?.name} del sistema.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteItem} className={cn(buttonVariants({ variant: 'destructive' }))}>
                    Sí, Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
