
"use client";

import { Appointment } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Eye, MessageSquare, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

export function DoctorAppointmentCard({ appointment, onOpenDialog, isPast = false }: { appointment: Appointment, onOpenDialog: (type: 'appointment' | 'chat', appointment: Appointment) => void, isPast?: boolean }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
                <p className="font-bold text-lg">{appointment.patientName}</p>
                <div className="flex items-center text-sm gap-4 pt-1 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {format(addHours(parseISO(appointment.date), 5), 'dd MMM yyyy', {locale: es})}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {appointment.time}</span>
                </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
              <p className="font-bold text-lg">${appointment.totalPrice.toFixed(2)}</p>
                <div className="flex flex-col gap-2 items-end">
                    {isPast ? (
                        <Badge variant={appointment.attendance === 'Atendido' ? 'default' : 'destructive'} className={cn({'bg-green-600 text-white': appointment.attendance === 'Atendido'})}>
                            {appointment.attendance}
                        </Badge>
                    ) : (
                    <>
                        <Badge variant={appointment.paymentStatus === 'Pagado' ? 'default' : 'secondary'} className={cn({'bg-green-600 text-white': appointment.paymentStatus === 'Pagado'})}>
                            {appointment.paymentStatus}
                        </Badge>
                        {appointment.patientConfirmationStatus === 'Pendiente' && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <HelpCircle className="mr-1 h-3 w-3" />
                            Por confirmar
                        </Badge>
                        )}
                        {appointment.patientConfirmationStatus === 'Confirmada' && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmada
                        </Badge>
                        )}
                        {appointment.patientConfirmationStatus === 'Cancelada' && (
                        <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Cancelada
                        </Badge>
                        )}
                    </>
                    )}
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 border-t mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onOpenDialog('chat', appointment)}><MessageSquare className="mr-2 h-4 w-4"/> Chat</Button>
            <Button size="sm" onClick={() => onOpenDialog('appointment', appointment)}><Eye className="mr-2 h-4 w-4"/> Ver Detalles</Button>
          </CardFooter>
        </Card>
    )
}
