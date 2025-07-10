"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { HeaderWrapper } from '@/components/header';
import * as firestoreService from '@/lib/firestoreService';
import type { Appointment, Doctor, Service, BankDetail, Coupon, Expense, AdminSupportTicket, ChatMessage, DoctorPayment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Pencil, Trash2, Send, CheckCircle, Wallet } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { useDoctorNotifications } from '@/lib/doctor-notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';

import { AppointmentsTab } from './dashboard/tabs/appointments-tab';
import { FinancesTab } from './dashboard/tabs/finances-tab';
import { SubscriptionTab } from './dashboard/tabs/subscription-tab';
import { ProfileTab } from './dashboard/tabs/profile-tab';
import { ServicesTab } from './dashboard/tabs/services-tab';
import { ScheduleTab } from './dashboard/tabs/schedule-tab';
import { BankDetailsTab } from './dashboard/tabs/bank-details-tab';
import { CouponsTab } from './dashboard/tabs/coupons-tab';
import { ChatTab } from './dashboard/tabs/chat-tab';
import { SupportTab } from './dashboard/tabs/support-tab';
import { AppointmentDetailDialog } from '@/components/doctor/appointment-detail-dialog';
import { Skeleton } from '../ui/skeleton';

const BankDetailFormSchema = z.object({
  bank: z.string().min(3, "El nombre del banco es requerido."),
  accountHolder: z.string().min(3, "El nombre del titular es requerido."),
  idNumber: z.string().min(5, "El C.I./R.I.F. es requerido."),
  accountNumber: z.string().min(20, "El número de cuenta debe tener 20 dígitos.").max(20, "El número de cuenta debe tener 20 dígitos."),
  description: z.string().nullable().optional(),
});

const ServiceFormSchema = z.object({
  name: z.string().min(3, "El nombre del servicio es requerido."),
  price: z.preprocess((val) => Number(val), z.number().min(0, "El precio no puede ser negativo.")),
});

const CouponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.preprocess((val) => Number(val), z.number().positive("El valor debe ser positivo.")),
});

const ExpenseFormSchema = z.object({
  date: z.string().min(1, "La fecha es requerida."),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.preprocess((val) => Number(val), z.number().positive("El monto debe ser un número positivo.")),
});

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function DashboardLoading() {
  return (
    <>
      <HeaderWrapper />
      <main className="flex-1 container py-12">
        <div className="mb-8">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    </>
  );
}

export function DoctorDashboardClient({ currentTab }: { currentTab: string }) {
    const { user, loading, changePassword } = useAuth();
    const router = useRouter();

    const { toast } = useToast();
    const { cities } = useSettings();
    const { checkAndSetDoctorNotifications } = useDoctorNotifications();

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [doctorData, setDoctorData] = useState<Doctor | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
    const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
    
    // Dialog states
    const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
    const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
    const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
    const [isSupportDetailOpen, setIsSupportDetailOpen] = useState(false);
    const [isPaymentReportOpen, setIsPaymentReportOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    // Entity states for dialogs
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editingBankDetail, setEditingBankDetail] = useState<BankDetail | null>(null);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [selectedSupportTicket, setSelectedSupportTicket] = useState<AdminSupportTicket | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'expense' | 'service' | 'bank' | 'coupon', id: string } | null>(null);

    // Form states
    const [chatMessage, setChatMessage] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    
    const handleTabChange = (value: string) => {
      router.push(`/doctor/dashboard?view=${value}`);
    };

    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'doctor' || !user.id) return;
        setIsLoadingData(true);
        try {
            const [doc, apps, tickets, payments] = await Promise.all([
                firestoreService.getDoctor(user.id),
                firestoreService.getDoctorAppointments(user.id),
                firestoreService.getSupportTickets(),
                firestoreService.getDoctorPayments(),
            ]);
            setDoctorData(doc);
            setAppointments(apps);
            setSupportTickets(tickets.filter(t => t.userId === user.email));
            setDoctorPayments(payments.filter(p => p.doctorId === user.id));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error de carga', description: 'No se pudieron cargar los datos del panel.' });
        } finally {
            setIsLoadingData(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user?.id) { fetchData(); }
    }, [user, fetchData]);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'doctor')) {
          router.push('/auth/login');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        if(user?.role === 'doctor' && appointments.length > 0 && doctorData) {
            const userTickets = supportTickets.filter(t => t.userId === user.email);
            checkAndSetDoctorNotifications(appointments, userTickets, doctorPayments);
        }
    }, [user, appointments, supportTickets, doctorPayments, doctorData, checkAndSetDoctorNotifications]);
    
    const cityFeesMap = useMemo(() => new Map(cities.map(c => [c.name, c.subscriptionFee])), [cities]);

    const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
        await firestoreService.updateAppointment(id, data);
        await fetchData();
        if (selectedAppointment && selectedAppointment.id === id) {
            setSelectedAppointment(prev => prev ? { ...prev, ...data } : null);
        }
        toast({ title: 'Cita actualizada' });
    };

    const handleOpenAppointmentDialog = (type: 'appointment' | 'chat', appointment: Appointment) => {
        setSelectedAppointment(appointment);
        if (type === 'appointment') setIsAppointmentDetailOpen(true);
        else if (type === 'chat') setIsChatOpen(true);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedAppointment || !user) return;
        setIsSendingMessage(true);
        try {
            await firestoreService.addMessageToAppointment(selectedAppointment.id, { sender: 'doctor', text: chatMessage.trim() });
            setChatMessage("");
            await fetchData();
            const updatedAppointment = appointments.find(a => a.id === selectedAppointment.id);
            if (updatedAppointment) setSelectedAppointment(updatedAppointment);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleSaveEntity = async (type: 'expense' | 'service' | 'bank' | 'coupon', data: any) => {
        if (!doctorData) return;
        const listKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        const list = (doctorData[listKey as keyof Doctor] || []) as any[];
        const editingEntity = type === 'expense' ? editingExpense : type === 'service' ? editingService : type === 'bank' ? editingBankDetail : editingCoupon;
        
        let newList;
        if (editingEntity) {
            newList = list.map(item => item.id === editingEntity.id ? { ...item, ...data } : item);
        } else {
            newList = [...list, { ...data, id: `${type}-${Date.now()}` }];
        }
        
        await firestoreService.updateDoctor(doctorData.id, { [listKey]: newList });
        await fetchData();
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} guardado.` });
        
        if (type === 'expense') setIsExpenseDialogOpen(false);
        if (type === 'service') setIsServiceDialogOpen(false);
        if (type === 'bank') setIsBankDetailDialogOpen(false);
        if (type === 'coupon') setIsCouponDialogOpen(false);
    };
    
    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            currentPassword: formData.get('currentPassword') as string,
            newPassword: formData.get('newPassword') as string,
            confirmPassword: formData.get('confirmPassword') as string
        };
        const result = PasswordChangeSchema.safeParse(data);
        if(!result.success){
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
            return;
        }
        const {success, message} = await changePassword(result.data.currentPassword, result.data.newPassword);
        if(success){
            toast({title: 'Éxito', description: message});
            setIsPasswordDialogOpen(false);
        } else {
            toast({variant: 'destructive', title: 'Error', description: message});
        }
    }

    const handleDeleteItem = async () => {
        if (!itemToDelete || !doctorData) return;
        const { type, id } = itemToDelete;
        const listKey = type === 'bank' ? 'bankDetails' : type === 'coupon' ? 'coupons' : `${type}s` as 'expenses' | 'services';
        const list = (doctorData[listKey as keyof Doctor] || []) as any[];
        const newList = list.filter(item => item.id !== id);
        
        await firestoreService.updateDoctor(doctorData.id, { [listKey]: newList });
        
        await fetchData();
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.` });
    };

    const handleReportPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!doctorData || !paymentProofFile) {
            toast({ variant: 'destructive', title: 'Falta el comprobante', description: 'Por favor, sube el archivo del comprobante de pago.' });
            return;
        }
        const formData = new FormData(e.currentTarget);
        const transactionId = formData.get('transactionId') as string;
        const amount = parseFloat(formData.get('amount') as string);
        
        const proofUrl = await fileToDataUri(paymentProofFile);

        await firestoreService.addDoctorPayment({
            doctorId: doctorData.id, doctorName: doctorData.name,
            date: new Date().toISOString().split('T')[0],
            amount: amount, status: 'Pending', transactionId, paymentProofUrl: proofUrl,
        });
        
        await firestoreService.updateDoctor(doctorData.id, { subscriptionStatus: 'pending_payment' });
        await fetchData();
        setIsPaymentReportOpen(false);
        toast({ title: 'Pago Reportado', description: 'Tu pago está en revisión por el equipo de SUMA.' });
    };

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || user.role !== 'doctor') return;
        const formData = new FormData(e.currentTarget);
        const data = { subject: formData.get('subject') as string, description: formData.get('description') as string };
        const result = SupportTicketSchema.safeParse(data);
        if(!result.success){
            toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
            return;
        }
        await firestoreService.addSupportTicket({ ...result.data, userId: user.email, userName: user.name, userRole: 'doctor', status: 'abierto', date: new Date().toISOString().split('T')[0] });
        fetchData();
        setIsSupportDialogOpen(false);
        toast({ title: 'Ticket Enviado' });
    }

    if (loading || isLoadingData || !user || !doctorData) {
        return <DashboardLoading />;
    }
    
    const subscriptionFee = cityFeesMap.get(doctorData.city) || 0;
    const tabs = [
        { value: "appointments", label: "Citas", component: <AppointmentsTab appointments={appointments} doctorData={doctorData} onOpenDialog={handleOpenAppointmentDialog} /> },
        { value: "finances", label: "Finanzas", component: <FinancesTab doctorData={doctorData} appointments={appointments} onOpenExpenseDialog={(exp) => {setEditingExpense(exp); setIsExpenseDialogOpen(true);}} onDeleteItem={(type, id) => {setItemToDelete({type, id}); setIsDeleteDialogOpen(true);}}/> },
        { value: "subscription", label: "Suscripción", component: <SubscriptionTab doctorData={doctorData} doctorPayments={doctorPayments} onOpenPaymentDialog={() => setIsPaymentReportOpen(true)} subscriptionFee={subscriptionFee}/> },
        { value: "profile", label: "Mi Perfil", component: <ProfileTab doctorData={doctorData} onProfileUpdate={fetchData} onPasswordChange={() => setIsPasswordDialogOpen(true)} /> },
        { value: "services", label: "Servicios", component: <ServicesTab services={doctorData.services || []} onOpenDialog={(s) => {setEditingService(s); setIsServiceDialogOpen(true);}} onDeleteItem={(type, id) => {setItemToDelete({type, id}); setIsDeleteDialogOpen(true);}}/> },
        { value: "schedule", label: "Horario", component: <ScheduleTab doctorData={doctorData} onScheduleUpdate={fetchData} /> },
        { value: "bank-details", label: "Cuentas", component: <BankDetailsTab bankDetails={doctorData.bankDetails || []} onOpenDialog={(bd) => {setEditingBankDetail(bd); setIsBankDetailDialogOpen(true);}} onDeleteItem={(type, id) => {setItemToDelete({type, id}); setIsDeleteDialogOpen(true);}}/> },
        { value: "coupons", label: "Cupones", component: <CouponsTab coupons={doctorData.coupons || []} onOpenDialog={(c) => {setEditingCoupon(c); setIsCouponDialogOpen(true);}} onDeleteItem={(type, id) => {setItemToDelete({type, id}); setIsDeleteDialogOpen(true);}}/> },
        { value: "chat", label: "Chat", component: <ChatTab /> },
        { value: "support", label: "Soporte", component: <SupportTab supportTickets={supportTickets} onViewTicket={(t) => {setSelectedSupportTicket(t); setIsSupportDetailOpen(true);}} onOpenTicketDialog={() => setIsSupportDialogOpen(true)} /> },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <HeaderWrapper />
            <main className="flex-1 bg-muted/40">
                <div className="container py-12">
                    <h1 className="text-3xl font-bold font-headline mb-2">Panel del Médico</h1>
                    <p className="text-muted-foreground mb-8">Bienvenido de nuevo, {user.name}.</p>
                    
                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10 h-auto">
                            {tabs.map(tab => (
                                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="mt-6">
                            {tabs.map(tab => (
                                <TabsContent key={tab.value} value={tab.value}>{tab.component}</TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </div>
            </main>
            
            <AppointmentDetailDialog isOpen={isAppointmentDetailOpen} onOpenChange={setIsAppointmentDetailOpen} appointment={selectedAppointment} doctorServices={doctorData.services || []} onUpdateAppointment={handleUpdateAppointment} onOpenChat={handleOpenAppointmentDialog}/>

            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Chat con {selectedAppointment?.patientName}</DialogTitle></DialogHeader>
                    <div className="p-4 h-96 flex flex-col gap-4 bg-muted/50 rounded-lg">
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                            {(selectedAppointment?.messages || []).map((msg) => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'doctor' && 'justify-end')}>
                                    {msg.sender === 'patient' && <Avatar className="h-8 w-8"><AvatarFallback>{selectedAppointment?.patientName?.charAt(0)}</AvatarFallback></Avatar>}
                                    <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'doctor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                                        <p className="text-sm">{msg.text}</p><p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(parseISO(msg.timestamp), { locale: es, addSuffix: true })}</p>
                                    </div>
                                    {msg.sender === 'doctor' && <Avatar className="h-8 w-8"><AvatarImage src={doctorData.profileImage} /><AvatarFallback>{doctorData.name.charAt(0)}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                            <Input placeholder="Escribe tu mensaje..." className="flex-1" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} disabled={isSendingMessage}/>
                            <Button type="submit" disabled={isSendingMessage || !chatMessage.trim()}>{isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
                        </form>
                    </div>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Cambiar Contraseña</DialogTitle></DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                        <div><Label htmlFor="currentPassword">Contraseña Actual</Label><Input id="currentPassword" name="currentPassword" type="password" required /></div>
                        <div><Label htmlFor="newPassword">Nueva Contraseña</Label><Input id="newPassword" name="newPassword" type="password" required /></div>
                        <div><Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label><Input id="confirmPassword" name="confirmPassword" type="password" required /></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Actualizar Contraseña</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentReportOpen} onOpenChange={setIsPaymentReportOpen}>
                <DialogContent><DialogHeader><DialogTitle>Reportar Pago de Suscripción</DialogTitle><DialogDescription>Completa la información para que verifiquemos tu pago.</DialogDescription></DialogHeader>
                    <form onSubmit={handleReportPayment} className="space-y-4 py-4">
                        <div><Label>Monto a Pagar</Label><Input value={`$${subscriptionFee.toFixed(2)}`} disabled /></div>
                        <div><Label htmlFor="transactionId">ID o Referencia de Transacción</Label><Input id="transactionId" name="transactionId" required/></div>
                        <div><Label htmlFor="amount">Monto Exacto Pagado</Label><Input id="amount" name="amount" type="number" step="0.01" required/></div>
                        <div><Label htmlFor="paymentProofFile">Comprobante de Pago</Label><Input id="paymentProofFile" type="file" required onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)} /></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Reportar Pago</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {name: fd.get('name') as string, price: parseFloat(fd.get('price') as string)}; const result = ServiceFormSchema.safeParse(data); if(result.success) handleSaveEntity('service', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="name">Nombre del Servicio</Label><Input id="name" name="name" defaultValue={editingService?.name || ''} required/></div>
                        <div><Label htmlFor="price">Precio ($)</Label><Input id="price" name="price" type="number" step="0.01" defaultValue={editingService?.price || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isBankDetailDialogOpen} onOpenChange={setIsBankDetailDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingBankDetail ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {bank: fd.get('bank') as string, accountHolder: fd.get('accountHolder') as string, idNumber: fd.get('idNumber') as string, accountNumber: fd.get('accountNumber') as string, description: fd.get('description') as string}; const result = BankDetailFormSchema.safeParse(data); if(result.success) handleSaveEntity('bank', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="bank">Banco</Label><Input id="bank" name="bank" defaultValue={editingBankDetail?.bank || ''} required/></div>
                        <div><Label htmlFor="accountHolder">Titular</Label><Input id="accountHolder" name="accountHolder" defaultValue={editingBankDetail?.accountHolder || ''} required/></div>
                        <div><Label htmlFor="idNumber">CI/RIF del Titular</Label><Input id="idNumber" name="idNumber" defaultValue={editingBankDetail?.idNumber || ''} required/></div>
                        <div><Label htmlFor="accountNumber">Número de Cuenta</Label><Input id="accountNumber" name="accountNumber" defaultValue={editingBankDetail?.accountNumber || ''} required/></div>
                        <div><Label htmlFor="description">Descripción (Opcional)</Label><Input id="description" name="description" defaultValue={editingBankDetail?.description || ''}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle></DialogHeader>
                     <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {code: fd.get('code') as string, discountType: fd.get('discountType') as 'percentage' | 'fixed', value: parseFloat(fd.get('value') as string)}; const result = CouponFormSchema.safeParse(data); if(result.success) handleSaveEntity('coupon', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="code">Código del Cupón</Label><Input id="code" name="code" defaultValue={editingCoupon?.code || ''} required/></div>
                        <div><Label htmlFor="discountType">Tipo</Label><Select name="discountType" defaultValue={editingCoupon?.discountType || 'fixed'}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fixed">Monto Fijo ($)</SelectItem><SelectItem value="percentage">Porcentaje (%)</SelectItem></SelectContent></Select></div>
                        <div><Label htmlFor="value">Valor</Label><Input id="value" name="value" type="number" step="0.01" defaultValue={editingCoupon?.value || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = {date: fd.get('date') as string, description: fd.get('description') as string, amount: parseFloat(fd.get('amount') as string)}; const result = ExpenseFormSchema.safeParse(data); if(result.success) handleSaveEntity('expense', result.data); else toast({variant: 'destructive', title: 'Error', description: result.error.errors.map(e=>e.message).join(' ')})}} className="space-y-4 py-4">
                        <div><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required/></div>
                        <div><Label htmlFor="description">Descripción</Label><Input id="description" name="description" defaultValue={editingExpense?.description || ''} required/></div>
                        <div><Label htmlFor="amount">Monto ($)</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount || ''} required/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Crear Ticket de Soporte</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
                        <div><Label htmlFor="subject">Asunto</Label><Input id="subject" name="subject" required/></div>
                        <div><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" required rows={5}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Enviar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Dialog open={isSupportDetailOpen} onOpenChange={setIsSupportDetailOpen}>
                <DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Ticket: {selectedSupportTicket?.subject}</DialogTitle></DialogHeader>
                    {selectedSupportTicket && (<div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto space-y-4 p-4 bg-muted/50 rounded-lg">{(selectedSupportTicket.messages || []).map(msg => <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'doctor' && 'justify-end')}><div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'doctor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}><p className="text-sm">{msg.text}</p><p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(parseISO(msg.timestamp), { locale: es, addSuffix: true })}</p></div></div>)}</div>
                        {selectedSupportTicket.status === 'abierto' && <div className="flex gap-2"><Input value={chatMessage} onChange={e=>setChatMessage(e.target.value)} placeholder="Escribe tu respuesta..."/><Button onClick={()=>{firestoreService.addMessageToSupportTicket(selectedSupportTicket.id, {sender: 'doctor', text: chatMessage}); setChatMessage(''); fetchData();}}><Send/></Button></div>}
                    </div>)}
                </DialogContent>
            </Dialog>
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente y no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteItem} className={cn(buttonVariants({variant: 'destructive'}))}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
