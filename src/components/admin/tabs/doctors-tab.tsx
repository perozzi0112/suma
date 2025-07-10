
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Doctor, Seller } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { Eye, Pencil, Trash2, CheckCircle, XCircle, UserPlus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";


const DoctorFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  specialty: z.string().min(1, "Debes seleccionar una especialidad."),
  city: z.string().min(1, "Debes seleccionar una ciudad."),
  address: z.string().min(5, "La dirección es requerida."),
  sellerId: z.string().nullable(),
  slotDuration: z.preprocess((val) => Number(val), z.number().int().min(5, "La duración debe ser al menos 5 min.").positive()),
  consultationFee: z.preprocess((val) => Number(val), z.number().min(0, "La tarifa de consulta no puede ser negativa.")),
});

export function DoctorsTab() {
  const { toast } = useToast();
  const { specialties, cities } = useSettings();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Doctor | null>(null);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [docs, sells] = await Promise.all([
            firestoreService.getDoctors(),
            firestoreService.getSellers(),
        ]);
        setDoctors(docs);
        setSellers(sells);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos de los médicos.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteDialog = (doctor: Doctor) => {
    setItemToDelete(doctor);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await firestoreService.deleteDoctor(itemToDelete.id);
      toast({ title: "Médico Eliminado" });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo completar la operación.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    await firestoreService.updateDoctorStatus(doctor.id, newStatus);
    toast({ title: "Estado Actualizado", description: `El Dr. ${doctor.name} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}.` });
    fetchData();
  };

  const handleSaveDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      specialty: formData.get('specialty') as string,
      city: formData.get('city') as string,
      address: formData.get('address') as string,
      sellerId: (formData.get('sellerId') as string) || null,
      slotDuration: formData.get('slotDuration') as string,
      consultationFee: formData.get('consultationFee') as string,
    };

    const result = DoctorFormSchema.safeParse(dataToValidate);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
      return;
    }
    
    if (editingDoctor) {
      // Logic for updating a doctor
      const updateData: Partial<Doctor> = {
        name: result.data.name,
        email: result.data.email,
        specialty: result.data.specialty,
        city: result.data.city,
        address: result.data.address,
        sellerId: result.data.sellerId,
        slotDuration: result.data.slotDuration,
        consultationFee: result.data.consultationFee,
      };

      if (result.data.password) {
        updateData.password = result.data.password;
      }
      
      await firestoreService.updateDoctor(editingDoctor.id, updateData);
      toast({ title: "Médico Actualizado", description: "Los datos del médico han sido guardados." });
    } else {
      // Logic for adding a new doctor
       if (!result.data.password) {
            toast({ variant: 'destructive', title: 'Contraseña Requerida', description: 'Debe establecer una contraseña para los nuevos médicos.' });
            return;
       }
       // Check if email exists
       const existingUser = await firestoreService.findUserByEmail(result.data.email);
       if(existingUser) {
            toast({ variant: 'destructive', title: 'Correo ya registrado', description: 'Este correo electrónico ya está en uso por otro usuario.' });
            return;
       }
       
        const { password, ...restOfData } = result.data;

        const newDoctorData: Omit<Doctor, 'id'> = {
            ...restOfData,
            password: password,
            cedula: '',
            sector: '',
            rating: 0,
            reviewCount: 0,
            profileImage: 'https://placehold.co/400x400.png',
            bannerImage: 'https://placehold.co/1200x400.png',
            aiHint: 'doctor portrait',
            description: 'Especialista comprometido con la salud y el bienestar de mis pacientes.',
            services: [],
            bankDetails: [],
            schedule: {
                monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
                friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
                saturday: { active: false, slots: [] },
                sunday: { active: false, slots: [] },
            },
            status: 'active',
            lastPaymentDate: new Date().toISOString().split('T')[0],
            whatsapp: '',
            lat: 0,
            lng: 0,
            joinDate: new Date().toISOString().split('T')[0],
            subscriptionStatus: 'active',
            nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            coupons: [],
            expenses: []
        };
        await firestoreService.addDoctor(newDoctorData);
        toast({ title: 'Médico Registrado', description: `El Dr. ${result.data.name} ha sido añadido.` });
    }

    fetchData();
    setIsDoctorDialogOpen(false);
    setEditingDoctor(null);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Gestión de Médicos</CardTitle>
            <CardDescription>Visualiza, edita y gestiona los médicos de la plataforma.</CardDescription>
          </div>
          <Button onClick={() => { setEditingDoctor(null); setIsDoctorDialogOpen(true); }}>
            <UserPlus className="mr-2 h-4 w-4"/> Añadir Médico
          </Button>
        </CardHeader>
        <CardContent>
           <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow><TableHead>Médico</TableHead><TableHead>Especialidad</TableHead><TableHead>Ubicación</TableHead><TableHead>Vendedora Asignada</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">{doctor.name}</TableCell>
                      <TableCell>{doctor.specialty}</TableCell>
                      <TableCell>{doctor.city}</TableCell>
                      <TableCell>{sellers.find(s => s.id === doctor.sellerId)?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge onClick={() => handleToggleDoctorStatus(doctor)} className={cn("cursor-pointer", doctor.status === 'active' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                          {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => { setEditingDoctor(doctor); setIsDoctorDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(doctor)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </div>
           <div className="space-y-4 md:hidden">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{doctor.name}</p>
                      <p className="text-sm text-muted-foreground">{doctor.specialty} - {doctor.city}</p>
                    </div>
                    <Badge onClick={() => handleToggleDoctorStatus(doctor)} className={cn("cursor-pointer", doctor.status === 'active' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                      {doctor.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingDoctor(doctor); setIsDoctorDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(doctor)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                  </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Editar Médico' : 'Añadir Nuevo Médico'}</DialogTitle>
            <DialogDescription>{editingDoctor ? `Editando el perfil de ${editingDoctor.name}.` : 'Completa los detalles para registrar un nuevo médico.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDoctor}>
            <div className="grid gap-4 py-4">
              <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" name="name" defaultValue={editingDoctor?.name} required/></div>
              <div><Label htmlFor="email">Correo Electrónico</Label><Input id="email" name="email" type="email" defaultValue={editingDoctor?.email} required/></div>
              <div><Label htmlFor="password">Nueva Contraseña</Label><Input id="password" name="password" type="password" placeholder={editingDoctor ? 'Dejar en blanco para no cambiar' : 'Requerido'} /></div>
              <div><Label htmlFor="confirmPassword">Confirmar Contraseña</Label><Input id="confirmPassword" name="confirmPassword" type="password"/></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Select name="specialty" defaultValue={editingDoctor?.specialty}>
                      <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                      <SelectContent>{specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Select name="city" defaultValue={editingDoctor?.city}>
                        <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                        <SelectContent>{cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
              </div>

              <div><Label htmlFor="address">Dirección del Consultorio</Label><Input id="address" name="address" defaultValue={editingDoctor?.address} required/></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consultationFee">Tarifa de Consulta ($)</Label>
                  <Input id="consultationFee" name="consultationFee" type="number" defaultValue={editingDoctor?.consultationFee || 20} required />
                </div>
                <div>
                  <Label htmlFor="slotDuration">Duración por Cita (min)</Label>
                  <Input id="slotDuration" name="slotDuration" type="number" defaultValue={editingDoctor?.slotDuration || 30} required />
                </div>
              </div>

              <div>
                <Label htmlFor="sellerId">Vendedora Asignada</Label>
                <Select name="sellerId" defaultValue={editingDoctor?.sellerId || ''}>
                  <SelectTrigger><SelectValue placeholder="Ninguna"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguna</SelectItem>
                    {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
