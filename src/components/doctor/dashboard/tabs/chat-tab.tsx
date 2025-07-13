
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, User } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/lib/auth';
import type { Appointment } from '@/lib/types';

interface ChatTabProps {
  appointments?: Appointment[];
  onOpenChat?: (appointment: Appointment) => void;
}

export function ChatTab({ appointments = [], onOpenChat }: ChatTabProps) {
  const { user } = useAuth();
  
  // Filtrar solo citas que tienen mensajes
  const chatAppointments = useMemo(() => {
    return appointments.filter(appt => 
      appt.messages && appt.messages.length > 0
    );
  }, [appointments]);

  const getLastMessage = (appointment: Appointment) => {
    if (!appointment.messages || appointment.messages.length === 0) return null;
    return appointment.messages[appointment.messages.length - 1];
  };

  const getUnreadCount = (appointment: Appointment) => {
    if (!appointment.messages) return 0;
    // Contar mensajes del paciente que no han sido leídos
    return appointment.messages.filter(msg => 
      msg.sender === 'patient' && !appointment.readByDoctor
    ).length;
  };

  if (chatAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat con Pacientes</CardTitle>
          <CardDescription>Aquí puedes comunicarte directamente con tus pacientes.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>No hay conversaciones activas.</p>
          <p className="text-sm mt-2">Los chats aparecerán aquí cuando los pacientes envíen mensajes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat con Pacientes ({chatAppointments.length})
          </CardTitle>
          <CardDescription>
            Conversaciones activas con tus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatAppointments.map((appointment) => {
              const lastMessage = getLastMessage(appointment);
              const unreadCount = getUnreadCount(appointment);
              
              return (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{appointment.patientName}</h4>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Cita: {format(parseISO(appointment.date), 'dd/MM/yyyy', { locale: es })} - {appointment.time}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          <span className="font-medium">
                            {lastMessage.sender === 'doctor' ? 'Tú' : appointment.patientName}:
                          </span> {lastMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {lastMessage && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(lastMessage.timestamp), 'HH:mm', { locale: es })}
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => onOpenChat?.(appointment)}
                      className="whitespace-nowrap"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {unreadCount > 0 ? 'Ver mensajes' : 'Abrir chat'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
