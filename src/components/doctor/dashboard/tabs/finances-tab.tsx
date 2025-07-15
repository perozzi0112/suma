
"use client";

import { useMemo, useState } from "react";
import type { Appointment, Expense, Doctor } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  DollarSign,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy', 
  week: 'Esta Semana', 
  month: 'Este Mes', 
  year: 'Este Año', 
  all: 'Global',
};

interface FinancesTabProps {
  doctorData: Doctor;
  appointments: Appointment[];
  onOpenExpenseDialog: (expense: Expense | null) => void;
  onDeleteItem: (type: 'expense', id: string) => void;
}

interface IncomeData {
  date: string;
  amount: number;
  appointments: number;
  patients: string[];
}

export function FinancesTab({ doctorData, appointments, onOpenExpenseDialog, onDeleteItem }: FinancesTabProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Calcular estadísticas financieras
  const financialStats = useMemo(() => {
    let filteredAppointments = appointments;
    let filteredExpenses = doctorData.expenses || [];

    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date, endDate: Date;
      switch (timeRange) {
          case 'today': 
            startDate = startOfDay(now); 
            endDate = endOfDay(now); 
            break;
          case 'week': 
            startDate = startOfWeek(now, { locale: es }); 
            endDate = endOfWeek(now, { locale: es }); 
            break;
          case 'year': 
            startDate = startOfYear(now); 
            endDate = endOfYear(now); 
            break;
          case 'month': 
          default: 
            startDate = startOfMonth(now); 
            endDate = endOfMonth(now); 
            break;
      }
      
      filteredAppointments = appointments.filter(a => {
          const apptDate = parseISO(a.date);
          return apptDate >= startDate && apptDate <= endDate;
      });
      filteredExpenses = (doctorData.expenses || []).filter(e => {
          const expenseDate = parseISO(e.date);
          return expenseDate >= startDate && expenseDate <= endDate;
      });
    }
    
    const paidAppointments = filteredAppointments.filter(a => a.paymentStatus === 'Pagado');
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAppointments = filteredAppointments.length;
    const uniquePatients = new Set(filteredAppointments.map(a => a.patientId)).size;

    return { 
      totalRevenue, 
      totalExpenses, 
      netProfit: totalRevenue - totalExpenses,
      totalAppointments,
      uniquePatients,
      paidAppointments: paidAppointments.length,
      pendingPayments: filteredAppointments.filter(a => a.paymentStatus === 'Pendiente').length
    };
  }, [doctorData, appointments, timeRange]);

  // Generar historial de ingresos por día/semana/mes
  const incomeHistory = useMemo(() => {
    const paidAppointments = appointments.filter(a => a.paymentStatus === 'Pagado');
    
    if (timeRange === 'all') {
      // Agrupar por mes para el historial global
      const monthlyData = new Map<string, IncomeData>();
      
      paidAppointments.forEach(appointment => {
        const monthKey = format(parseISO(appointment.date), 'yyyy-MM');
        const existing = monthlyData.get(monthKey) || {
          date: monthKey,
          amount: 0,
          appointments: 0,
          patients: []
        };
        
        existing.amount += appointment.totalPrice;
        existing.appointments += 1;
        if (!existing.patients.includes(appointment.patientId)) {
          existing.patients.push(appointment.patientId);
        }
        
        monthlyData.set(monthKey, existing);
      });
      
      return Array.from(monthlyData.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          date: format(parseISO(item.date + '-01'), 'MMM yyyy', { locale: es })
        }));
    }
    
    const now = new Date();
    let startDate: Date, endDate: Date;
    switch (timeRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { locale: es });
        endDate = endOfWeek(now, { locale: es });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        return [];
    }
    
    const filteredAppointments = paidAppointments.filter(a => {
      const apptDate = parseISO(a.date);
      return apptDate >= startDate && apptDate <= endDate;
    });
    
    if (timeRange === 'today') {
      // Agrupar por hora del día
      const hourlyData = new Map<string, IncomeData>();
      for (let i = 0; i < 24; i++) {
        const hourKey = `${i.toString().padStart(2, '0')}:00`;
        hourlyData.set(hourKey, {
          date: hourKey,
          amount: 0,
          appointments: 0,
          patients: []
        });
      }
      
      filteredAppointments.forEach(appointment => {
        const hour = format(parseISO(appointment.date + 'T' + appointment.time), 'HH:00');
        const existing = hourlyData.get(hour)!;
        existing.amount += appointment.totalPrice;
        existing.appointments += 1;
        if (!existing.patients.includes(appointment.patientId)) {
          existing.patients.push(appointment.patientId);
        }
      });
      
      return Array.from(hourlyData.values());
    } else if (timeRange === 'week') {
      // Agrupar por día de la semana
      const dailyData = new Map<string, IncomeData>();
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        dailyData.set(dayKey, {
          date: format(day, 'EEE dd/MM', { locale: es }),
          amount: 0,
          appointments: 0,
          patients: []
        });
      });
      
      filteredAppointments.forEach(appointment => {
        const dayKey = appointment.date;
        const existing = dailyData.get(dayKey);
        if (existing) {
          existing.amount += appointment.totalPrice;
          existing.appointments += 1;
          if (!existing.patients.includes(appointment.patientId)) {
            existing.patients.push(appointment.patientId);
          }
        }
      });
      
      return Array.from(dailyData.values());
    } else if (timeRange === 'month') {
      // Agrupar por semana del mes
      const weeklyData = new Map<string, IncomeData>();
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { locale: es });
      
      weeks.forEach((week, index) => {
        const weekKey = `Semana ${index + 1}`;
        weeklyData.set(weekKey, {
          date: weekKey,
          amount: 0,
          appointments: 0,
          patients: []
        });
      });
      
      filteredAppointments.forEach(appointment => {
        const apptDate = parseISO(appointment.date);
        const weekIndex = Math.floor((apptDate.getDate() - 1) / 7);
        const weekKey = `Semana ${weekIndex + 1}`;
        const existing = weeklyData.get(weekKey);
        if (existing) {
          existing.amount += appointment.totalPrice;
          existing.appointments += 1;
          if (!existing.patients.includes(appointment.patientId)) {
            existing.patients.push(appointment.patientId);
          }
        }
      });
      
      return Array.from(weeklyData.values());
    } else if (timeRange === 'year') {
      // Agrupar por mes del año
      const monthlyData = new Map<string, IncomeData>();
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      
      months.forEach(month => {
        const monthKey = format(month, 'yyyy-MM');
        monthlyData.set(monthKey, {
          date: format(month, 'MMM', { locale: es }),
          amount: 0,
          appointments: 0,
          patients: []
        });
      });
      
      filteredAppointments.forEach(appointment => {
        const monthKey = format(parseISO(appointment.date), 'yyyy-MM');
        const existing = monthlyData.get(monthKey);
        if (existing) {
          existing.amount += appointment.totalPrice;
          existing.appointments += 1;
          if (!existing.patients.includes(appointment.patientId)) {
            existing.patients.push(appointment.patientId);
          }
        }
      });
      
      return Array.from(monthlyData.values());
    }
    
    return [];
  }, [appointments, timeRange]);

  // Filtrar gastos
  const filteredExpenses = useMemo(() => {
    let expenses = doctorData.expenses || [];
    
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date, endDate: Date;
      switch (timeRange) {
        case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
        case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfWeek(now, { locale: es }); break;
        case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
        case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
      }
      
      expenses = expenses.filter(e => {
        const expenseDate = parseISO(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }
    
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [doctorData.expenses, timeRange]);

  return (
    <div className="space-y-6">
      {/* Filtros de tiempo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-xl">
                <BarChart3 className="h-5 w-5" />
                Panel Financiero
              </CardTitle>
              <CardDescription>
                Análisis detallado de ingresos, gastos y rentabilidad
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex w-full justify-between gap-1 md:gap-2">
            <Button 
              variant={timeRange === 'today' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('today')}
              size="sm"
              className="flex-1 px-1 py-1 text-xs md:text-sm min-w-0"
            >
              Hoy
            </Button>
            <Button 
              variant={timeRange === 'week' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('week')}
              size="sm"
              className="flex-1 px-1 py-1 text-xs md:text-sm min-w-0"
            >
              Semana
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('month')}
              size="sm"
              className="flex-1 px-1 py-1 text-xs md:text-sm min-w-0"
            >
              Mes
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('year')}
              size="sm"
              className="flex-1 px-1 py-1 text-xs md:text-sm min-w-0"
            >
              Año
            </Button>
            <Button 
              variant={timeRange === 'all' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('all')}
              size="sm"
              className="flex-1 px-1 py-1 text-xs md:text-sm min-w-0"
            >
              Global
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${financialStats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats.paidAppointments} citas pagadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${financialStats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} gastos registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${financialStats.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats.netProfit >= 0 ? 'Ganancia' : 'Pérdida'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financialStats.uniquePatients}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats.totalAppointments} citas totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="income">Historial de Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>

        {/* Tab de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumen de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Citas Pagadas:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {financialStats.paidAppointments}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pagos Pendientes:</span>
                  <Badge variant="secondary">
                    {financialStats.pendingPayments}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Citas:</span>
                  <Badge variant="outline">
                    {financialStats.totalAppointments}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ingresos</span>
                    <span className="font-medium">${financialStats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${financialStats.totalRevenue > 0 ? 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gastos</span>
                    <span className="font-medium">${financialStats.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${financialStats.totalRevenue > 0 ? (financialStats.totalExpenses / financialStats.totalRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Historial de Ingresos */}
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historial de Ingresos - {timeRangeLabels[timeRange]}
              </CardTitle>
              <CardDescription>
                Desglose detallado de ingresos por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Citas</TableHead>
                      <TableHead className="text-right">Pacientes</TableHead>
                      <TableHead className="text-right">Promedio/Cita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeHistory.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.date}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          ${item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{item.appointments}</TableCell>
                        <TableCell className="text-right">{item.patients.length}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${item.appointments > 0 ? (item.amount / item.appointments).toFixed(2) : '0.00'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de ingresos para este período.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Gastos - Mejorado para móvil */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="border-2 border-red-200 bg-red-50/30">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <TrendingDown className="h-6 w-6" />
                  Registro de Gastos
                </CardTitle>
                <CardDescription className="text-red-700">
                  Administra tus gastos operativos y de consultorio - Control financiero esencial
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => onOpenExpenseDialog(null)} className="bg-red-600 hover:bg-red-700">
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Agregar Gasto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Vista móvil con cards */}
              <div className="block sm:hidden space-y-3">
                {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                  <Card key={expense.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{expense.description}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600 text-lg">
                            ${expense.amount.toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {expense.category || 'Sin categoría'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onOpenExpenseDialog(expense)}
                          className="flex-1"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => onDeleteItem('expense', expense.id)}
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="text-muted-foreground mb-4">No hay gastos registrados.</p>
                    <Button 
                      onClick={() => onOpenExpenseDialog(null)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <PlusCircle className="mr-2 h-4 w-4"/>
                      Agregar primer gasto
                    </Button>
                  </div>
                )}
              </div>

              {/* Vista desktop con tabla */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-[120px] text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {expense.category || 'Sin categoría'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600 font-bold">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => onOpenExpenseDialog(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => onDeleteItem('expense', expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          <div className="flex flex-col items-center gap-2">
                            <TrendingDown className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No hay gastos registrados.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => onOpenExpenseDialog(null)}
                            >
                              <PlusCircle className="mr-2 h-4 w-4"/>
                              Agregar primer gasto
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
