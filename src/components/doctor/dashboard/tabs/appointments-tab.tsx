
"use client";
import { useMemo, useState } from "react";
import type { Appointment, Doctor } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DoctorAppointmentCard } from "@/components/doctor/appointment-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentsTabProps {
  appointments: Appointment[];
  doctorData: Doctor;
  onOpenDialog: (type: 'appointment' | 'chat', appointment: Appointment) => void;
}

export function AppointmentsTab({ appointments, doctorData, onOpenDialog }: AppointmentsTabProps) {
  const [pendingMonthFilter, setPendingMonthFilter] = useState('all');

  const { todayAppointments, tomorrowAppointments, upcomingAppointments, pastAppointments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');

    const tomorrow = addDays(today, 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    const todayAppts: Appointment[] = [];
    const tomorrowAppts: Appointment[] = [];
    const upcomingAppts: Appointment[] = [];
    const pastAppts: Appointment[] = [];
    
    appointments.forEach(appt => {
        const apptDate = parseISO(appt.date);
         if (appt.attendance !== 'Pendiente' || apptDate < today) {
            pastAppts.push(appt);
        } else if (appt.date === todayStr) {
            todayAppts.push(appt);
        } else if (appt.date === tomorrowStr) {
            tomorrowAppts.push(appt);
        } else if (apptDate > tomorrow) {
            upcomingAppts.push(appt);
        }
    });

    const sortByTime = (a: Appointment, b: Appointment) => a.time.localeCompare(b.time);
    todayAppts.sort(sortByTime);
    tomorrowAppts.sort(sortByTime);
    upcomingAppts.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    pastAppts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));

    return { todayAppointments: todayAppts, tomorrowAppointments: tomorrowAppts, upcomingAppointments: upcomingAppts, pastAppointments: pastAppts };
  }, [appointments]);

  const pendingMonthsForFilter = useMemo(() => {
    const months = new Set<string>();
    upcomingAppointments.forEach(appt => {
        months.add(format(new Date(appt.date + 'T00:00:00'), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => a.localeCompare(b));
  }, [upcomingAppointments]);

  const filteredPendingAppointments = useMemo(() => {
    if (pendingMonthFilter === 'all') {
        return upcomingAppointments;
    }
    return upcomingAppointments.filter(appt => appt.date.startsWith(pendingMonthFilter));
  }, [upcomingAppointments, pendingMonthFilter]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Citas de Hoy ({todayAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {todayAppointments.length > 0 ? (
                todayAppointments.map(appt => <DoctorAppointmentCard key={appt.id} appointment={appt} onOpenDialog={onOpenDialog} />)
            ) : (
                <p className="text-center text-muted-foreground py-10">No hay citas para hoy.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Citas de Mañana ({tomorrowAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {tomorrowAppointments.length > 0 ? (
                tomorrowAppointments.map(appt => <DoctorAppointmentCard key={appt.id} appointment={appt} onOpenDialog={onOpenDialog} />)
            ) : (
                <p className="text-center text-muted-foreground py-10">No hay citas para mañana.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Próximas Citas Pendientes</CardTitle>
              <CardDescription>Citas a partir de pasado mañana.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pendingMonthFilter} onValueChange={setPendingMonthFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Filtrar por mes..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  <Separator />
                  {pendingMonthsForFilter.map(month => (
                    <SelectItem key={month} value={month}>
                      {format(new Date(month + '-02'), "LLLL yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredPendingAppointments.length > 0 ? (
              filteredPendingAppointments.map(appt => <DoctorAppointmentCard key={appt.id} appointment={appt} onOpenDialog={onOpenDialog} />)
          ) : (
              <p className="text-center text-muted-foreground py-10">
                  No hay más citas pendientes.
              </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Citas</CardTitle>
          <CardDescription>Citas pasadas y atendidas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pastAppointments.length > 0 ? (
              pastAppointments.map(appt => <DoctorAppointmentCard key={appt.id} appointment={appt} onOpenDialog={onOpenDialog} isPast />)
          ) : (
              <p className="text-center text-muted-foreground py-10">
                  No hay citas en el historial.
              </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
