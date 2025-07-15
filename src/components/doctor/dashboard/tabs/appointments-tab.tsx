
"use client";
import { useMemo, useState } from "react";
import type { Appointment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DoctorAppointmentCard } from "@/components/doctor/appointment-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export function AppointmentsTab({ appointments, onOpenDialog }: { appointments: Appointment[]; onOpenDialog: (type: 'appointment' | 'chat', appointment: Appointment) => void }) {
  const [pendingMonthFilter, setPendingMonthFilter] = useState('all');
  
  // Estados para paginación y filtros del historial
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const itemsPerPage = 10;

  console.log('🔍 AppointmentsTab render:');
  console.log('  📅 Initial pendingMonthFilter:', pendingMonthFilter);
  console.log('  📋 Total appointments received:', appointments.length);

  const { todayAppointments, tomorrowAppointments, upcomingAppointments, filteredPastAppointments, totalPages } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');

    const tomorrow = addDays(today, 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    console.log('🔍 Debugging appointments filtering:');
    console.log('📅 Today:', today.toISOString());
    console.log('📅 Today string:', todayStr);
    console.log('📅 Tomorrow:', tomorrow.toISOString());
    console.log('📅 Tomorrow string:', tomorrowStr);
    console.log('📋 Total appointments:', appointments.length);
    console.log('📋 All appointments:', appointments.map(a => ({
      id: a.id,
      date: a.date,
      time: a.time,
      patientName: a.patientName,
      paymentMethod: a.paymentMethod,
      attendance: a.attendance,
      parsedDate: parseISO(a.date).toISOString()
    })));

    const todayAppts: Appointment[] = [];
    const tomorrowAppts: Appointment[] = [];
    const upcomingAppts: Appointment[] = [];
    const pastAppts: Appointment[] = [];
    
    appointments.forEach(appt => {
        // Usar la fecha como string para comparaciones más precisas
        const apptDateStr = appt.date;
        const apptDate = parseISO(appt.date);
        
        // Comparar fechas como strings para evitar problemas de zona horaria
        const isPast = appt.attendance !== 'Pendiente' || apptDateStr < todayStr;
        const isToday = apptDateStr === todayStr;
        const isTomorrow = apptDateStr === tomorrowStr;
        const isUpcoming = apptDateStr > tomorrowStr;
        
        console.log(`🔍 Processing appointment: ${appt.id}`);
        console.log(`  📅 Date: ${appt.date} (${apptDate.toISOString()})`);
        console.log(`  👤 Patient: ${appt.patientName}`);
        console.log(`  ✅ Attendance: ${appt.attendance}`);
        console.log(`  📊 Logic: isPast=${isPast}, isToday=${isToday}, isTomorrow=${isTomorrow}, isUpcoming=${isUpcoming}`);
        console.log(`  🔍 Comparisons: apptDateStr=${apptDateStr}, todayStr=${todayStr}, tomorrowStr=${tomorrowStr}`);
        
        if (isPast) {
            console.log(`  ➡️ Going to past appointments`);
            pastAppts.push(appt);
        } else if (isToday) {
            console.log(`  ➡️ Going to today appointments`);
            todayAppts.push(appt);
        } else if (isTomorrow) {
            console.log(`  ➡️ Going to tomorrow appointments`);
            tomorrowAppts.push(appt);
        } else if (isUpcoming) {
            console.log(`  ➡️ Going to upcoming appointments`);
            upcomingAppts.push(appt);
        } else {
            console.log(`  ⚠️ Appointment not categorized! This shouldn't happen.`);
            // Si no se categoriza, por defecto va a próximas
            upcomingAppts.push(appt);
        }
    });

    console.log('📊 Filtered results:');
    console.log('  - Today:', todayAppts.length);
    console.log('  - Tomorrow:', tomorrowAppts.length);
    console.log('  - Upcoming:', upcomingAppts.length);
    console.log('  - Past:', pastAppts.length);
    
    console.log('📋 Upcoming appointments details:');
    upcomingAppts.forEach(appt => {
      console.log(`  - ${appt.date} ${appt.time}: ${appt.patientName} (${appt.attendance})`);
    });

    const sortByTime = (a: Appointment, b: Appointment) => a.time.localeCompare(b.time);
    todayAppts.sort(sortByTime);
    tomorrowAppts.sort(sortByTime);
    upcomingAppts.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    pastAppts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));

    // Aplicar filtro por fecha si está activo
    let filteredPast = pastAppts;
    if (isFilterActive && dateFilter) {
      filteredPast = pastAppts.filter(appt => appt.date === dateFilter);
    }
    
    // Calcular paginación
    const totalPages = Math.ceil(filteredPast.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPast = filteredPast.slice(startIndex, endIndex);

    return { 
      todayAppointments: todayAppts, 
      tomorrowAppointments: tomorrowAppts, 
      upcomingAppointments: upcomingAppts, 
      filteredPastAppointments: paginatedPast,
      totalPages 
    };
  }, [appointments, dateFilter, isFilterActive, currentPage, itemsPerPage]);

  const pendingMonthsForFilter = useMemo(() => {
    const months = new Set<string>();
    upcomingAppointments.forEach(appt => {
        months.add(format(new Date(appt.date + 'T00:00:00'), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => a.localeCompare(b));
  }, [upcomingAppointments]);

  const filteredPendingAppointments = useMemo(() => {
    console.log('🔍 Filtering pending appointments:');
    console.log('  📅 Selected month filter:', pendingMonthFilter);
    console.log('  📋 Total upcoming appointments:', upcomingAppointments.length);
    console.log('  📋 Upcoming appointments:', upcomingAppointments.map(a => ({
      date: a.date,
      month: format(new Date(a.date + 'T00:00:00'), 'yyyy-MM'),
      patientName: a.patientName
    })));
    
    if (pendingMonthFilter === 'all') {
        console.log('  ✅ Showing all upcoming appointments');
        return upcomingAppointments;
    }
    
    const filtered = upcomingAppointments.filter(appt => appt.date.startsWith(pendingMonthFilter));
    console.log('  📊 Filtered appointments:', filtered.length);
    console.log('  📋 Filtered appointments:', filtered.map(a => `${a.date} ${a.time}: ${a.patientName}`));
    
    return filtered;
  }, [upcomingAppointments, pendingMonthFilter]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Citas de Hoy ({todayAppointments.length})</CardTitle>
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
            <CardTitle className="text-base md:text-xl">Citas de Mañana ({tomorrowAppointments.length})</CardTitle>
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
              <CardTitle className="text-base md:text-xl">Próximas Citas Pendientes</CardTitle>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base md:text-xl">Historial de Citas</CardTitle>
              <CardDescription>Citas pasadas y atendidas.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Filtrar por fecha..."
                  value={dateFilter}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className="pl-10 w-full sm:w-[200px]"
                />
              </div>
              {isFilterActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilter}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredPastAppointments.length > 0 ? (
              filteredPastAppointments.map(appt => <DoctorAppointmentCard key={appt.id} appointment={appt} onOpenDialog={onOpenDialog} isPast />)
          ) : (
              <p className="text-center text-muted-foreground py-10">
                  {isFilterActive 
                    ? 'No se encontraron citas para la fecha seleccionada.' 
                    : 'No hay citas en el historial.'
                  }
              </p>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
