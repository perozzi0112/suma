
"use client";

import { useEffect, useState } from "react";
import type { Appointment, Service } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Eye, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Save, CreditCard } from "lucide-react";
import { format, parseISO, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface AppointmentDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  doctorServices: Service[];
  onUpdateAppointment: (id: string, data: Partial<Appointment>) => void;
  onOpenChat: (type: 'chat', appointment: Appointment) => void;
}

export function AppointmentDetailDialog({
  isOpen,
  onOpenChange,
  appointment,
  doctorServices,
  onUpdateAppointment,
  onOpenChat,
}: AppointmentDetailDialogProps) {
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [editableServices, setEditableServices] = useState<Service[]>([]);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);

  // Calculate editableTotalPrice
  const editableTotalPrice =
    (appointment?.consultationFee || 0) +
    editableServices.reduce((sum, s) => sum + (s.price || 0), 0) -
    (appointment?.discountAmount || 0);

  useEffect(() => {
    if (appointment) {
      setClinicalNotes(appointment.clinicalNotes || "");
      setPrescription(appointment.prescription || "");
      setEditableServices(appointment.services || []);
    }
  }, [appointment]);

  const handleSaveServices = () => {
    if (appointment) {
      onUpdateAppointment(appointment.id, {
        services: editableServices,
        totalPrice: editableTotalPrice,
        // Mantener los campos de descuento y cupón si existen
        discountAmount: appointment.discountAmount ?? 0,
        appliedCoupon: appointment.appliedCoupon ?? undefined,
      });
    }
  };

  const handleSaveRecord = () => {
    if (appointment) {
        onUpdateAppointment(appointment.id, { clinicalNotes, prescription });
    }
  };

  const handleViewProof = () => {
    if (!appointment?.paymentProof) {
      alert('No hay comprobante disponible para esta cita.');
      return;
    }
    setIsProofDialogOpen(true);
  };

  if (!appointment) {
    return null;
  }

  const isAttended = appointment.attendance === 'Atendido';
  const isAppointmentLocked = appointment.attendance !== 'Pendiente';

  // Función para obtener el texto del estado de pago
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'Pagado':
        return 'Pago Confirmado';
      case 'Pendiente':
        return 'Pendiente de Pago';
      default:
        return status;
    }
  };

  // Función para obtener el icono del estado de pago
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'Pagado':
        return <CheckCircle className="mr-1 h-4 w-4" />;
      case 'Pendiente':
        return <CreditCard className="mr-1 h-4 w-4" />;
      default:
        return null;
    }
  };

  console.log("APPOINTMENT EN MODAL:", appointment);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Detalles de la Cita</DialogTitle>
                <DialogDescription>Cita con {appointment.patientName} el {format(addHours(parseISO(appointment.date), 5), 'dd MMM yyyy', { locale: es })} a las {appointment.time}.</DialogDescription>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="text-base">Información del Paciente</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Nombre:</strong> {appointment.patientName}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Detalles del Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            {/* Mostrar el subtotal antes de descuento si hay descuento */}
                            {appointment.discountAmount && appointment.discountAmount > 0 && (
                                <p>
                                    <strong>Subtotal:</strong>
                                    <span className="font-mono">
                                        ${(appointment.totalPrice + appointment.discountAmount).toFixed(2)}
                                    </span>
                                </p>
                            )}
                            {/* Mostrar el descuento si existe */}
                            {appointment.discountAmount && appointment.discountAmount > 0 && (
                                <p>
                                    <strong>Descuento:</strong>
                                    <span className="font-mono text-green-600">
                                        -${appointment.discountAmount.toFixed(2)}
                                    </span>
                                    {appointment.appliedCoupon && (
                                        <span className="ml-2 text-xs text-green-700">
                                            (Cupón: {appointment.appliedCoupon})
                                        </span>
                                    )}
                                </p>
                            )}
                            {/* Mostrar el total final */}
                            <p>
                                <strong>Total:</strong>
                                <span className="font-mono font-semibold">
                                    ${appointment.totalPrice.toFixed(2)}
                                    {appointment.discountAmount && appointment.discountAmount > 0 && (
                                        <span className="ml-2 text-green-600 text-xs font-normal">
                                            (con descuento)
                                        </span>
                                    )}
                                </span>
                            </p>
                            <p>
                                <strong>Método:</strong>
                                <span className="capitalize">{appointment.paymentMethod}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <strong>Estado:</strong>
                                <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn({'bg-green-600 text-white': appointment.paymentStatus === 'Pagado'})}>
                                    {getPaymentStatusIcon(appointment.paymentStatus)}
                                    {getPaymentStatusText(appointment.paymentStatus)}
                                </Badge>
                            </div>
                            
                            {appointment.paymentMethod === 'transferencia' && (
                                <>
                                      <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full mt-2"
                                          onClick={handleViewProof}
                                          disabled={!appointment.paymentProof}
                                      >
                                        <Eye className="mr-2 h-4 w-4"/> Ver Comprobante
                                      </Button>
                                </>
                            )}
                            
                            {appointment.paymentStatus === 'Pendiente' && (
                                <Button size="sm" className="w-full mt-2" onClick={() => onUpdateAppointment(appointment.id, { paymentStatus: 'Pagado' })}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> 
                                    {appointment.paymentMethod === 'efectivo' ? 'Confirmar Pago en Efectivo' : 'Aprobar Pago'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Gestión de la Cita</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {appointment.attendance === 'Pendiente' ? (
                                <div className="flex items-center gap-4">
                                    <Label>Asistencia del Paciente:</Label>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant='outline' onClick={() => onUpdateAppointment(appointment.id, { attendance: 'Atendido' })}> <ThumbsUp className="mr-2 h-4 w-4"/>Atendido </Button>
                                        <Button size="sm" variant='outline' onClick={() => onUpdateAppointment(appointment.id, { attendance: 'No Asistió' })}> <ThumbsDown className="mr-2 h-4 w-4"/>No Asistió </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Label>Asistencia:</Label>
                                    <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': appointment.attendance === 'Atendido'})}>
                                        {appointment.attendance}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                           <CardTitle className="text-base flex justify-between items-center">
                                <span>Servicios de la Cita</span>
                                {!isAppointmentLocked && (
                                    <Button size="sm" variant="secondary" onClick={handleSaveServices}><Save className="mr-2 h-4 w-4" /> Guardar Servicios</Button>
                                )}
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                                <Label htmlFor="consulta-base" className="font-semibold">Consulta Base</Label>
                                <span className="font-mono font-semibold">${(appointment.consultationFee || 0).toFixed(2)}</span>
                           </div>
                           <Separator />
                           <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {doctorServices.length > 0 ? doctorServices.map(service => (
                                    <div key={service.id} className="flex justify-between items-center">
                                        <span>{service.name}</span>
                                        <span className="font-mono">${service.price.toFixed(2)}</span>
                                    </div>
                                )) : (
                                    <div className="text-muted-foreground text-xs">Sin servicios adicionales</div>
                                )}
                           </div>
                           <Separator />
                           {/* Mostrar descuento si existe */}
                           {appointment.discountAmount && appointment.discountAmount > 0 && (
                             <div className="flex justify-between items-center text-green-600 text-sm">
                               <span>
                                 Descuento:
                                 {appointment.appliedCoupon && (
                                   <span className="ml-1 text-green-700">
                                     (Cupón: <span className="font-mono">{appointment.appliedCoupon}</span>)
                                   </span>
                                 )}
                               </span>
                               <span className="font-mono">-${appointment.discountAmount.toFixed(2)}</span>
                             </div>
                           )}
                           {/* Mostrar el total final */}
                           <div className="flex justify-between items-center font-bold text-lg pt-2">
                               <span>Total:</span>
                             <span className="text-primary">${appointment.totalPrice?.toFixed(2) ?? "0.00"}</span>
                           </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>Registro Clínico</span>
                                <Button size="sm" variant="secondary" onClick={handleSaveRecord} disabled={!isAttended}>
                                    <Save className="mr-2 h-4 w-4"/> Guardar Registro
                                </Button>
                            </CardTitle>
                             {!isAttended && (
                                <CardDescription className="text-xs pt-1">
                                    Marca la cita como &quot;Atendido&quot; para poder añadir notas.
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="clinicalNotes">Historia Clínica / Notas</Label>
                                <Textarea 
                                    id="clinicalNotes" 
                                    value={clinicalNotes} 
                                    onChange={(e) => setClinicalNotes(e.target.value)} 
                                    rows={5} 
                                    placeholder="Añade notas sobre la consulta..." 
                                    disabled={!isAttended}
                                />
                            </div>
                            <div>
                                <Label htmlFor="prescription">Récipé e Indicaciones</Label>
                                <Textarea 
                                    id="prescription" 
                                    value={prescription} 
                                    onChange={(e) => setPrescription(e.target.value)} 
                                    rows={5} 
                                    placeholder="Añade el récipe y las indicaciones médicas..." 
                                    disabled={!isAttended}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
            <DialogFooter className="gap-2 sm:justify-end pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => { onOpenChat('chat', appointment); onOpenChange(false); }}><MessageSquare className="mr-2 h-4 w-4" />Abrir Chat</Button>
                <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

      {/* Diálogo para mostrar el comprobante de pago */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Comprobante de Pago
                  </DialogTitle>
                  <DialogDescription>
                      Comprobante de pago para la cita con {appointment?.patientName}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  {appointment?.paymentProof ? (
                      <div className="relative w-full h-[60vh] bg-muted rounded-lg overflow-hidden">
                          {appointment.paymentProof.startsWith('data:') ? (
                              // Es un archivo base64
                              <Image 
                                  src={appointment.paymentProof} 
                                  alt="Comprobante de pago" 
                                  fill 
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                              />
                          ) : (
                              // Es una URL
                              <Image 
                                  src={appointment.paymentProof} 
                                  alt="Comprobante de pago" 
                                  fill 
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                              />
                          )}
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                          No se pudo cargar el comprobante
                      </div>
                  )}
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="outline">Cerrar</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
