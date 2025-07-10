
"use client";

import { useMemo, useState } from "react";
import type { Appointment, Expense, Doctor } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, PlusCircle, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfMonth, startOfMonth, endOfYear, startOfYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const timeRangeLabels: Record<string, string> = {
  today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', all: 'Global',
};

interface FinancesTabProps {
  doctorData: Doctor;
  appointments: Appointment[];
  onOpenExpenseDialog: (expense: Expense | null) => void;
  onDeleteItem: (type: 'expense', id: string) => void;
}

export function FinancesTab({ doctorData, appointments, onOpenExpenseDialog, onDeleteItem }: FinancesTabProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  const financialStats = useMemo(() => {
    let filteredAppointments = appointments;
    let filteredExpenses = doctorData.expenses || [];

    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date, endDate: Date;
      switch (timeRange) {
          case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
          case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfDay(now); break;
          case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
          case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
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
    
    const totalRevenue = filteredAppointments.filter(a => a.paymentStatus === 'Pagado').reduce((sum, a) => sum + a.totalPrice, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
  }, [doctorData, appointments, timeRange]);

  return (
    <div className="space-y-6">
      <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
        <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
        <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Semana</Button>
        <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Mes</Button>
        <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Año</Button>
        <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Global</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${financialStats.totalRevenue.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gastos</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${financialStats.totalExpenses.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financialStats.netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">{timeRangeLabels[timeRange]}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><CardTitle>Registro de Gastos</CardTitle><CardDescription>Administra tus gastos operativos y de consultorio.</CardDescription></div>
          <Button onClick={() => onOpenExpenseDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {(doctorData?.expenses || []).length > 0 ? doctorData.expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => onOpenExpenseDialog(expense)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => onDeleteItem('expense', expense.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
