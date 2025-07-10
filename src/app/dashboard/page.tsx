
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { HeaderWrapper, BottomNav } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarPlus, ClipboardList, User, Edit, CalendarDays, Clock, ThumbsUp, CalendarX, CheckCircle, XCircle, MessageSquare, Send, Loader2, FileText } from 'lucide-react';
import { useAppointments } from '@/lib/appointments';
import { useNotifications } from '@/lib/notifications';
import { type Appointment, type Doctor, type ChatMessage } from '@/lib/types';
import * as firestoreService from '@/lib/firestoreService';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';


function AppointmentCard({ 
  appointment, 
  doctor,
  isPast = false,
  onUpdateConfirmation,
  onOpenChat,
  onOpenRecord,
}: { 
  appointment: Appointment, 
  doctor: Doctor | undefined,
  isPast?: boolean,
  onUpdateConfirmation?: (id: string, status: 'Confirmada' | 'Cancelada') => void,
  onOpenChat: (appointment: Appointment) => void,
  onOpenRecord?: (appointment: Appointment) => void,
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <p className="font-bold text-lg">{appointment.doctorName}</p>
          <p className="text-sm text-muted-foreground">{appointment.services.map(s => s.name).join(', ')}</p>
          <div className="flex items-center text-sm gap-4 pt-1 text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appointment.time}</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-auto hidden sm:block mx-2" />
        <Separator orientation="horizontal" className="w-full block sm:hidden my-2" />
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between">
          <p className="font-bold text-lg">${appointment.totalPrice.toFixed(2)}</p>
          {isPast ? (
              <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={appointment.attendance === 'Atendido' ? 'bg-green-600 text-white' : ''}>
                  {appointment.attendance}
              </Badge>
          ) : (
              <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={appointment.paymentStatus === 'Pagado' ? 'bg-green-600 text-white' : ''}>
                  {appointment.paymentStatus}
              </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t mt-4 flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start w-full">
            {onUpdateConfirmation && appointment.patientConfirmationStatus === 'Pendiente' && (
            <>
                <p className="text-sm text-muted-foreground text-center sm:text-left flex-1 basis-full sm:basis-auto">¿Asistirás a esta cita?</p>
                <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onUpdateConfirmation(appointment.id, 'Cancelada')}>
                    <CalendarX className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={() => onUpdateConfirmation(appointment.id, 'Confirmada')}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Confirmar
                </Button>
                </div>
            </>
            )}
            {appointment.patientConfirmationStatus === 'Confirmada' && !isPast && (
            <Badge variant="default" className="bg-green-600 text-white justify-center py-1.5 px-3">
                <CheckCircle className="mr-2 h-4 w-4" /> Asistencia Confirmada
            </Badge>
            )}
            {appointment.patientConfirmationStatus === 'Cancelada' && (
            <Badge variant="destructive" className="justify-center py-1.5 px-3">
                <XCircle className="mr-2 h-4 w-4" /> Cita Cancelada por ti
            </Badge>
            )}
            {isPast && appointment.attendance === 'Atendido' && onOpenRecord && (
                <Button variant="secondary" onClick={() => onOpenRecord(appointment)}>
                    <ClipboardList className="mr-2 h-4 w-4" /> Ver Resumen
                </Button>
            )}
        </div>
        <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
           {doctor && <Button size="sm" variant="ghost" onClick={() => onOpenChat(appointment)}><MessageSquare className="mr-2 h-4 w-4"/> Contactar</Button>}
        </div>
      </CardFooter>
    </Card>
  );
}


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { appointments, updateAppointmentConfirmation, refreshAppointments } = useAppointments();
  const { checkAndSetNotifications } = useNotifications();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedChatAppointment, setSelectedChatAppointment] = useState<Appointment | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedRecordAppointment, setSelectedRecordAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
        setIsDoctorsLoading(true);
        try {
            const doctorsData = await firestoreService.getDoctors();
            setAllDoctors(doctorsData);
        } catch (error) {
            console.error("Failed to fetch doctors for dashboard, possibly offline.", error);
            toast({
                variant: "destructive",
                title: "Error de red",
                description: "No se pudieron cargar los datos de los médicos.",
            });
        } finally {
            setIsDoctorsLoading(false);
        }
    }
    fetchDoctors();
  }, [toast]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
        router.push('/auth/login');
    } else if (user?.role === 'doctor') {
        router.push('/doctor/dashboard');
    } else if (user?.role === 'seller') {
        router.push('/seller/dashboard');
    } else if (user?.role === 'admin') {
        router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!user?.email) return { upcomingAppointments: [], pastAppointments: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        // An appointment moves to past if the date has passed OR if attendance has been marked.
        if (apptDate < today || appt.attendance !== 'Pendiente') {
            past.push(appt);
        } else {
            upcoming.push(appt);
        }
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [user, appointments]);
  
  useEffect(() => {
    if (user?.role === 'patient' && appointments.length > 0) {
      checkAndSetNotifications(appointments);
    }
  }, [user, appointments, checkAndSetNotifications]);

  const handleOpenChat = (appointment: Appointment) => {
    setSelectedChatAppointment(appointment);
    setIsChatDialogOpen(true);
  };
  
  const handleOpenRecord = (appointment: Appointment) => {
    setSelectedRecordAppointment(appointment);
    setIsRecordDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedChatAppointment || !user) return;
    setIsSendingMessage(true);

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        sender: 'patient',
        text: chatMessage.trim(),
    };

    try {
        await firestoreService.addMessageToAppointment(selectedChatAppointment.id, newMessage);
        
        // Optimistically update UI
        const fullMessage: ChatMessage = { ...newMessage, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() };
        const updatedAppointment = {
            ...selectedChatAppointment,
            messages: [...(selectedChatAppointment.messages || []), fullMessage]
        };
        setSelectedChatAppointment(updatedAppointment);
        
        await refreshAppointments();
        setChatMessage("");

    } catch (error) {
        console.error("Error sending message:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
    } finally {
        setIsSendingMessage(false);
    }
  };


  if (authLoading || isDoctorsLoading || !user || user.role !== 'patient') {
    return (
       <div className="flex flex-col min-h-screen">
        <HeaderWrapper />
        <main className="flex-1 container py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  const selectedChatDoctor = allDoctors.find(d => d.id === selectedChatAppointment?.doctorId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 bg-muted/40 pb-20 md:pb-0">
        <div className="container py-12">
          <h1 className="text-3xl font-bold font-headline mb-2">¡Bienvenido de nuevo, {user.name}!</h1>
          <p className="text-muted-foreground mb-8">Este es tu panel médico personal.</p>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 grid gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Citas</CardTitle>
                  {upcomingAppointments.length === 0 && (
                     <CardDescription>No tienes próximas citas agendadas.</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.map(appt => (
                        <AppointmentCard 
                          key={appt.id} 
                          appointment={appt} 
                          doctor={allDoctors.find(d => d.id === appt.doctorId)}
                          onUpdateConfirmation={updateAppointmentConfirmation}
                          onOpenChat={handleOpenChat}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                      <CalendarPlus className="h-12 w-12" />
                      <p>¿Listo para tu próxima consulta?</p>
                      <Button asChild>
                        <Link href="/find-a-doctor">Reservar una Cita</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial Médico</CardTitle>
                  <CardDescription>Un resumen de tus consultas pasadas.</CardDescription>
                </CardHeader>
                <CardContent>
                   {pastAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {pastAppointments.map(appt => (
                        <AppointmentCard 
                          key={appt.id} 
                          appointment={appt} 
                          doctor={allDoctors.find(d => d.id === appt.doctorId)}
                          isPast 
                          onOpenChat={handleOpenChat}
                          onOpenRecord={handleOpenRecord}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                      <ClipboardList className="h-12 w-12" />
                      <p>Tu historial médico aparecerá aquí después de tu primera cita.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User /> Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                   <div>
                      <p className="font-semibold">Nombre</p>
                      <p className="text-muted-foreground">{user.name}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Correo Electrónico</p>
                      <p className="text-muted-foreground">{user.email}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Edad</p>
                      <p className="text-muted-foreground">{user.age || 'No especificada'}</p>
                   </div>
                    <div>
                      <p className="font-semibold">Sexo</p>
                      <p className="text-muted-foreground capitalize">{user.gender || 'No especificado'}</p>
                   </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">
                        <Edit className="mr-2 h-4 w-4"/>
                        Editar Perfil
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />

      {/* Chat Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
               <Avatar>
                  <AvatarImage src={selectedChatDoctor?.profileImage} alt={selectedChatDoctor?.name} />
                  <AvatarFallback>{selectedChatDoctor?.name?.charAt(0)}</AvatarFallback>
               </Avatar>
               Chat con {selectedChatDoctor?.name}
            </DialogTitle>
            <DialogDescription>
              Conversación sobre la cita del {selectedChatAppointment && format(new Date(selectedChatAppointment.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 h-96 flex flex-col gap-4 bg-muted/50 rounded-lg">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {(selectedChatAppointment?.messages || []).map((msg) => (
                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'patient' && 'justify-end')}>
                    {msg.sender === 'doctor' && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedChatDoctor?.profileImage} />
                            <AvatarFallback>{selectedChatDoctor?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'patient' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}</p>
                    </div>
                    {msg.sender === 'patient' && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImage ?? undefined} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
              <Input 
                placeholder="Escribe tu mensaje..." 
                className="flex-1"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={isSendingMessage}
              />
              <Button type="submit" disabled={isSendingMessage || !chatMessage.trim()}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
           <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Clinical Record Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Resumen de Cita</DialogTitle>
                <DialogDescription>
                    Resumen de tu cita con {selectedRecordAppointment?.doctorName} el {selectedRecordAppointment && format(new Date(selectedRecordAppointment.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}.
                </DialogDescription>
            </DialogHeader>
            {selectedRecordAppointment && (
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-lg flex items-center gap-2"><ClipboardList /> Historia Clínica</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md whitespace-pre-wrap">
                            {selectedRecordAppointment.clinicalNotes || "El médico no ha añadido notas para esta consulta."}
                        </p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold text-lg flex items-center gap-2"><FileText /> Récipé e Indicaciones</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md whitespace-pre-wrap">
                            {selectedRecordAppointment.prescription || "El médico no ha añadido un récipe para esta consulta."}
                        </p>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
