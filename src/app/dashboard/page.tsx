
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, ClipboardList, User, Edit, CalendarDays, Clock, ThumbsUp, CalendarX, CheckCircle, XCircle, MessageSquare, Send, Loader2, FileText, MapPin, Star, Stethoscope, RefreshCw, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useAppointments } from '@/lib/appointments';
import { useNotifications } from '@/lib/notifications';
import { useChatNotifications } from '@/lib/chat-notifications';
import * as firestoreService from '@/lib/firestoreService';
import type { Appointment, Doctor, ChatMessage } from '@/lib/types';
import { HeaderWrapper, BottomNav } from '@/components/header';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WelcomeModal } from '@/components/welcome-modal';


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
    <Card className={cn(
      "hover:shadow-md transition-shadow relative",
      isPast && appointment.attendance === 'Atendido' && "border-green-200 bg-green-50/30",
      isPast && appointment.attendance === 'No Asistió' && "border-red-200 bg-red-50/30"
    )}>
      {/* Indicador de estado para citas pasadas */}
      {isPast && (
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 rounded-t-lg",
          appointment.attendance === 'Atendido' ? "bg-green-500" : "bg-red-500"
        )} />
      )}
      <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="font-bold text-base sm:text-lg">{appointment.doctorName}</p>
              {doctor && (
                <Badge variant="outline" className="text-xs w-fit">
                  {doctor.specialty}
                </Badge>
              )}
            </div>
            {doctor && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{doctor.city}</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{doctor.rating} ({doctor.reviewCount} reseñas)</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Servicios:</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {appointment.services.map(s => (
                <Badge key={s.id} variant="secondary" className="text-xs">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-2 sm:gap-4 pt-1 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> 
              {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> 
              {appointment.time}
            </span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-auto hidden sm:block mx-2" />
        <Separator orientation="horizontal" className="w-full block sm:hidden my-2" />
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
          <div className="text-right">
            <p className="font-bold text-base sm:text-lg text-primary">${appointment.totalPrice.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {appointment.paymentMethod === 'efectivo' ? 'Pago en efectivo' : 'Transferencia bancaria'}
            </p>
          </div>
          {isPast ? (
              <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={appointment.attendance === 'Atendido' ? 'bg-green-600 text-white' : ''}>
                  {appointment.attendance === 'Atendido' ? '✅ Atendido' : '❌ No Asistió'}
              </Badge>
          ) : (
              <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={appointment.paymentStatus === 'Pagado' ? 'bg-green-600 text-white' : ''}>
                  {appointment.paymentStatus === 'Pagado' ? '✅ Pagado' : '⏳ Pendiente'}
              </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 border-t mt-4">
        <div className="w-full space-y-3">
          {/* Estado de confirmación */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {onUpdateConfirmation && appointment.patientConfirmationStatus === 'Pendiente' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <p className="text-sm text-muted-foreground">¿Asistirás a esta cita?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onUpdateConfirmation(appointment.id, 'Cancelada')}>
                    <CalendarX className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={() => onUpdateConfirmation(appointment.id, 'Confirmada')}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Confirmar
                  </Button>
                </div>
              </div>
            )}
            {appointment.patientConfirmationStatus === 'Confirmada' && !isPast && (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="mr-2 h-4 w-4" /> Asistencia Confirmada
              </Badge>
            )}
            {appointment.patientConfirmationStatus === 'Cancelada' && (
              <Badge variant="destructive">
                <XCircle className="mr-2 h-4 w-4" /> Cita Cancelada por ti
              </Badge>
            )}
          </div>
          
          {/* Acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-2">
              {isPast && appointment.attendance === 'Atendido' && onOpenRecord && (
                <Button variant="secondary" size="sm" onClick={() => onOpenRecord(appointment)}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Ver Resumen Clínico
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {doctor && (
                <Button size="sm" variant="outline" onClick={() => onOpenChat(appointment)}>
                  <MessageSquare className="mr-2 h-4 w-4"/> Contactar Doctor
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { appointments, updateAppointmentConfirmation, refreshAppointments } = useAppointments();
  const { checkAndSetNotifications } = useNotifications();
  const { updateUnreadChatCount } = useChatNotifications();
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
  
  // Estados para paginación y filtros del historial
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const itemsPerPage = 10;

  // Estado para el modal de bienvenida
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
        setIsDoctorsLoading(true);
        try {
            const doctorsData = await firestoreService.getDoctors();
            setAllDoctors(doctorsData);
        } catch {
            console.error("Failed to fetch doctors for dashboard, possibly offline.");
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

  // Mostrar modal de bienvenida para pacientes nuevos
  useEffect(() => {
    if (user?.role === 'patient' && user.profileCompleted === false) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  const { upcomingAppointments } = useMemo(() => {
    if (!user?.email) return { 
      upcomingAppointments: [], 
      totalPages: 0 
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Appointment[] = [];

    appointments.forEach(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        // An appointment moves to past if the date has passed OR if attendance has been marked.
        if (apptDate < today || appt.attendance !== 'Pendiente') {
            // This appointment is in the past or attendance is marked, so it's not upcoming.
        } else {
            upcoming.push(appt);
        }
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcular paginación
    const totalPages = Math.ceil(upcoming.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUpcoming = upcoming.slice(startIndex, endIndex);
    
    return { 
      upcomingAppointments: paginatedUpcoming,
      totalPages 
    };
  }, [user, appointments, currentPage, itemsPerPage]);
  
  useEffect(() => {
    if (user?.role === 'patient' && appointments.length > 0) {
      checkAndSetNotifications(appointments);
      updateUnreadChatCount(appointments);
    }
  }, [user, appointments, checkAndSetNotifications, updateUnreadChatCount]);

  const handleOpenChat = (appointment: Appointment) => {
    setSelectedChatAppointment(appointment);
    setIsChatDialogOpen(true);
    // Marcar mensajes como leídos cuando se abre el chat
    if (appointment.messages && appointment.messages.length > 0) {
      const lastMessage = appointment.messages[appointment.messages.length - 1];
      if (lastMessage.sender === 'doctor' && !appointment.readByPatient) {
        firestoreService.updateAppointment(appointment.id, { readByPatient: true });
      }
    }
  };
  
  const handleOpenRecord = (appointment: Appointment) => {
    setSelectedRecordAppointment(appointment);
    setIsRecordDialogOpen(true);
  };

  const handleRefreshAppointments = async () => {
    try {
      await refreshAppointments();
      toast({ title: 'Datos actualizados', description: 'Se han refrescado las citas.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron actualizar los datos.' });
    }
  };

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    setIsFilterActive(date !== '');
    setCurrentPage(1); // Resetear a la primera página
  };

  const clearFilter = () => {
    setDateFilter('');
    setIsFilterActive(false);
    setCurrentPage(1);
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
        // Actualizar contador de chat no leído
        updateUnreadChatCount(appointments);

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
        <div className="container py-4 md:py-12">
          <div className="flex justify-between items-start mb-3 md:mb-8">
            <div>
              <h1 className="text-lg md:text-3xl font-bold font-headline mb-1 md:mb-2">¡Bienvenido de nuevo, {user.name}!</h1>
              <p className="text-xs md:text-base text-muted-foreground">Este es tu panel médico personal.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshAppointments}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden md:inline">Actualizar</span>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-3 md:gap-8 items-start">
            <div className="md:col-span-2 grid gap-3 md:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-xl">Próximas Citas</CardTitle>
                  {upcomingAppointments.length === 0 && (
                     <CardDescription className="text-xs md:text-sm">No tienes próximas citas agendadas.</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-2 md:space-y-4">
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
                    <div className="text-center py-6 md:py-12 text-muted-foreground flex flex-col items-center gap-2 md:gap-4">
                      <CalendarPlus className="h-8 w-8 md:h-12 md:w-12" />
                      <p className="text-xs md:text-base">¿Listo para tu próxima consulta?</p>
                      <Button asChild size="sm" className="text-xs md:text-base">
                        <Link href="/find-a-doctor">Reservar una Cita</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                    <div>
                      <CardTitle className="text-base md:text-xl">Historial Médico</CardTitle>
                      <CardDescription className="text-xs md:text-sm">Un resumen de tus consultas pasadas.</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder="Filtrar por fecha..."
                          value={dateFilter}
                          onChange={(e) => handleDateFilter(e.target.value)}
                          className="pl-10 w-full sm:w-[140px] md:w-[200px] text-xs md:text-sm h-8 md:h-10"
                        />
                      </div>
                      {isFilterActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilter}
                          className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                        >
                          <Filter className="h-4 w-4" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                   {/* The original code had filteredPastAppointments, pero ya no se usa. */}
                   {appointments.length > 0 ? (
                    <div className="space-y-2 md:space-y-4">
                      {appointments.map(appt => (
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
                    <div className="text-center py-6 md:py-12 text-muted-foreground flex flex-col items-center gap-2 md:gap-4">
                      <ClipboardList className="h-8 w-8 md:h-12 md:w-12" />
                      <p className="text-xs md:text-base">
                        {isFilterActive 
                          ? 'No se encontraron citas para la fecha seleccionada.' 
                          : 'Tu historial médico aparecerá aquí después de tu primera cita.'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
                {/* Pagination removed as it's not directly tied to filteredPastAppointments */}
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-xl"><User /> Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-4">
                  {/* Foto de perfil */}
                  <div className="flex justify-center">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20">
                      <AvatarImage src={user.profileImage ?? undefined} alt={user.name} />
                      <AvatarFallback className="text-base md:text-lg">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
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
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full text-xs md:text-base">
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
      <Dialog open={isChatDialogOpen} onOpenChange={(open) => {
        setIsChatDialogOpen(open);
        if (!open) {
          // Actualizar contador cuando se cierra el chat
          updateUnreadChatCount(appointments);
        }
      }}>
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

      {/* Welcome Modal para pacientes nuevos */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
      />

    </div>
  );
}
