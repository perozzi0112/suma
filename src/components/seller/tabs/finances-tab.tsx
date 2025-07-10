
"use client";

import { useMemo, useState, useEffect } from 'react';
import type { Seller, Doctor, SellerPayment, Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DollarSign, Wallet, TrendingDown, TrendingUp, ChevronLeft, ChevronRight, Eye, Landmark, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfMonth, startOfMonth, endOfYear, startOfYear, getMonth, getYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '@/lib/settings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

const timeRangeLabels: Record<string, string> = {
    today: 'Hoy', week: 'Esta Semana', month: 'Este Mes', year: 'Este Año', all: 'Todos'
};

const ExpenseFormSchema = z.object({
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser un número positivo."),
  date: z.string().min(1, "La fecha es requerida."),
});

interface FinancesTabProps {
  sellerData: Seller;
  sellerPayments: SellerPayment[];
}

export function FinancesTab({ sellerData, sellerPayments }: FinancesTabProps) {
  const { cities } = useSettings();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  
  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SellerPayment | null>(null);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expensePage, setExpensePage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);
  
  const [referredDoctors, setReferredDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);


  useEffect(() => {
    const fetchReferredDoctors = async () => {
      if (!sellerData.id) return;
      setIsLoadingDoctors(true);
      const allDocs = await firestoreService.getDoctors();
      setReferredDoctors(allDocs.filter(d => d.sellerId === sellerData.id));
      setIsLoadingDoctors(false);
    }
    fetchReferredDoctors();
  }, [sellerData.id]);


  const cityFeesMap = useMemo(() => new Map(cities.map(c => [c.name, c.subscriptionFee])), [cities]);

  const financeStats = useMemo(() => {
    const now = new Date();
    const currentPeriod = format(now, "LLLL yyyy", { locale: es });
    
    const hasBeenPaidThisPeriod = sellerPayments.some(p => p.period.toLowerCase() === currentPeriod.toLowerCase());
    const activeReferred = referredDoctors.filter(d => d.status === 'active');
    
    let pendingCommission = 0;
    if (!hasBeenPaidThisPeriod) {
        pendingCommission = activeReferred.reduce((sum, doc) => {
            const fee = cityFeesMap.get(doc.city) || 0;
            return sum + (fee * sellerData.commissionRate);
        }, 0);
    }
    const doctorsForPendingCommission = hasBeenPaidThisPeriod ? [] : activeReferred;
    
    let startDate: Date, endDate: Date;
    let filteredPayments = sellerPayments;
    let filteredExpenses = sellerData.expenses || [];
    
    if (timeRange !== 'all') {
        switch (timeRange) {
            case 'today': startDate = startOfDay(now); endDate = endOfDay(now); break;
            case 'week': startDate = startOfWeek(now, { locale: es }); endDate = endOfDay(now); break;
            case 'year': startDate = startOfYear(now); endDate = endOfYear(now); break;
            case 'month': default: startDate = startOfMonth(now); endDate = endOfMonth(now); break;
        }

        filteredPayments = sellerPayments.filter(p => {
            const paymentDate = new Date(p.paymentDate + 'T00:00:00');
            return paymentDate >= startDate && paymentDate <= endDate;
        });

        filteredExpenses = (sellerData.expenses || []).filter(e => {
            const expenseDate = new Date(e.date + 'T00:00:00');
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    const totalEarned = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalEarned - totalExpenses;
    
    const nextPaymentMonth = getMonth(now) === 11 ? 0 : getMonth(now) + 1;
    const nextPaymentYear = getMonth(now) === 11 ? getYear(now) + 1 : getYear(now);
    const nextPaymentDate = `16 de ${format(new Date(nextPaymentYear, nextPaymentMonth), 'LLLL', { locale: es })}`;
    
    return { 
        pendingCommission, totalEarned, totalExpenses, netProfit, nextPaymentDate,
        currentPeriod: currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1),
        filteredPayments, filteredExpenses, doctorsForPendingCommission, hasBeenPaidThisPeriod,
        activeReferredCount: activeReferred.length
    };
  }, [referredDoctors, sellerPayments, sellerData, cityFeesMap, timeRange]);
  
  const paginatedSellerExpenses = useMemo(() => {
    if (expenseItemsPerPage === -1) return financeStats.filteredExpenses;
    const startIndex = (expensePage - 1) * expenseItemsPerPage;
    return financeStats.filteredExpenses.slice(startIndex, startIndex + expenseItemsPerPage);
  }, [financeStats.filteredExpenses, expensePage, expenseItemsPerPage]);
  
  const totalExpensePages = useMemo(() => {
    if (expenseItemsPerPage === -1) return 1;
    return Math.ceil(financeStats.filteredExpenses.length / expenseItemsPerPage);
  }, [financeStats.filteredExpenses, expenseItemsPerPage]);

  const handleOpenExpenseDialog = (expense: Expense | null) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sellerData) return;
    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
        description: formData.get('expenseDescription') as string,
        amount: parseFloat(formData.get('expenseAmount') as string) || 0,
        date: formData.get('expenseDate') as string,
    };
    const result = ExpenseFormSchema.safeParse(dataToValidate);

    if (!result.success) {
        toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
        return;
    }
    
    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : `expense-${Date.now()}`,
      ...result.data,
    };

    let updatedExpenses;
    if (editingExpense) {
        updatedExpenses = (sellerData.expenses || []).map(exp => exp.id === editingExpense.id ? newExpense : exp);
    } else {
        updatedExpenses = [...(sellerData.expenses || []), newExpense];
    }

    await firestoreService.updateSeller(sellerData.id, { expenses: updatedExpenses });
    setIsExpenseDialogOpen(false);
    toast({ title: "Gasto Guardado" });
  };

  const handleDeleteExpense = async () => {
    if (!sellerData || !itemToDelete) return;
    const updatedExpenses = (sellerData.expenses || []).filter(exp => exp.id !== itemToDelete);
    await firestoreService.updateSeller(sellerData.id, { expenses: updatedExpenses });
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    toast({ title: "Gasto Eliminado" });
  };
  
  return (
    <>
      <div className="space-y-8">
        <div className="w-full">
            <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
                <Button variant={timeRange === 'today' ? 'default' : 'outline'} onClick={() => setTimeRange('today')}>Hoy</Button>
                <Button variant={timeRange === 'week' ? 'default' : 'outline'} onClick={() => setTimeRange('week')}>Esta Semana</Button>
                <Button variant={timeRange === 'month' ? 'default' : 'outline'} onClick={() => setTimeRange('month')}>Este Mes</Button>
                <Button variant={timeRange === 'year' ? 'default' : 'outline'} onClick={() => setTimeRange('year')}>Este Año</Button>
                <Button variant={timeRange === 'all' ? 'default' : 'outline'} onClick={() => setTimeRange('all')}>Todos</Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comisión Pendiente</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${financeStats.pendingCommission.toFixed(2)}</div><p className="text-xs text-muted-foreground">{financeStats.activeReferredCount} médicos activos</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Recibidos</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">${financeStats.totalEarned.toFixed(2)}</div><p className="text-xs text-muted-foreground">Pagos de SUMA ({timeRangeLabels[timeRange]})</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gastos</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">${financeStats.totalExpenses.toFixed(2)}</div><p className="text-xs text-muted-foreground">Gastos ({timeRangeLabels[timeRange]})</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${financeStats.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>${financeStats.netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">Ingresos - Gastos ({timeRangeLabels[timeRange]})</p></CardContent></Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Desglose de Comisiones Pendientes</CardTitle>
                <CardDescription>
                    {financeStats.hasBeenPaidThisPeriod 
                        ? `La comisión para el período de ${financeStats.currentPeriod} ya fue procesada.`
                        : `Desglose de tu próxima comisión para el período de ${financeStats.currentPeriod}. El pago se realizará el ${financeStats.nextPaymentDate}.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Médico Activo</TableHead><TableHead>Fecha de Ingreso</TableHead><TableHead className="text-right">Comisión Estimada</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {financeStats.doctorsForPendingCommission.length > 0 ? (
                            financeStats.doctorsForPendingCommission.map(doctor => (
                                <TableRow key={doctor.id}>
                                    <TableCell className="font-medium">{doctor.name}</TableCell>
                                    <TableCell>{format(new Date(doctor.joinDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</TableCell>
                                    <TableCell className="text-right font-mono">${((cityFeesMap.get(doctor.city) || 0) * (sellerData?.commissionRate || 0)).toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">{financeStats.hasBeenPaidThisPeriod ? "Comisión de este mes ya pagada." : "No tienes médicos activos para generar comisiones."}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="justify-end font-bold bg-muted/50 py-3">
                <div className="flex items-center gap-4 text-lg"><span>Total Pendiente:</span><span className="text-amber-600">${financeStats.pendingCommission.toFixed(2)}</span></div>
            </CardFooter>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Landmark/> Historial de Pagos de SUMA</CardTitle><CardDescription>Registro de todas las comisiones que has recibido.</CardDescription></CardHeader>
            <CardContent>
                <div className="hidden md:block">
                    <Table>
                        <TableHeader><TableRow><TableHead>Fecha de Pago</TableHead><TableHead>Período de Comisión</TableHead><TableHead>Médicos Pagados</TableHead><TableHead className="text-right">Monto Recibido</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {financeStats.filteredPayments.length > 0 ? financeStats.filteredPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{format(new Date(payment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                                    <TableCell>{payment.period}</TableCell><TableCell>{payment.includedDoctors.length}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600 font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-center"><Button variant="outline" size="sm" onClick={() => { setSelectedPayment(payment); setIsPaymentDetailDialogOpen(true); }}><Eye className="mr-2 h-4 w-4"/>Ver Detalles</Button></TableCell>
                                </TableRow>
                            )) : (<TableRow><TableCell colSpan={5} className="h-24 text-center">No has recibido pagos en este período.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
                <div className="space-y-4 md:hidden">
                     {financeStats.filteredPayments.length > 0 ? financeStats.filteredPayments.map((payment) => (
                        <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <div><p className="font-semibold">{payment.period}</p><p className="text-sm text-muted-foreground">Pagado el {format(new Date(payment.paymentDate + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</p></div>
                                <p className="text-lg font-bold font-mono text-green-600">${payment.amount.toFixed(2)}</p>
                            </div><Separator/>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedPayment(payment); setIsPaymentDetailDialogOpen(true); }}><Eye className="mr-2 h-4 w-4"/>Ver Detalles del Pago</Button>
                        </div>
                     )) : (<div className="h-24 text-center flex items-center justify-center text-muted-foreground">No has recibido pagos en este período.</div>)}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><CardTitle>Registro de Gastos</CardTitle><CardDescription>Administra tus gastos operativos.</CardDescription></div>
                <Button onClick={() => handleOpenExpenseDialog(null)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Agregar Gasto</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[120px] text-center">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paginatedSellerExpenses.length > 0 ? paginatedSellerExpenses.map(expense => (
                            <TableRow key={expense.id}>
                                <TableCell>{format(new Date(expense.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                <TableCell className="font-medium">{expense.description}</TableCell>
                                <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-center"><div className="flex items-center justify-center gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => {setItemToDelete(expense.id); setIsDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4" /></Button>
                                </div></TableCell>
                            </TableRow>
                        )) : (<TableRow><TableCell colSpan={4} className="text-center h-24">No hay gastos registrados en este período.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Página {expensePage} de {totalExpensePages}</div>
                <div className="flex items-center gap-2">
                    <Select value={String(expenseItemsPerPage)} onValueChange={(value) => { setExpenseItemsPerPage(Number(value)); setExpensePage(1); }}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / página</SelectItem><SelectItem value="20">20 / página</SelectItem>
                            <SelectItem value="50">50 / página</SelectItem><SelectItem value="-1">Todos</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setExpensePage(p => Math.max(1, p - 1))} disabled={expensePage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => setExpensePage(p => Math.min(totalExpensePages, p + 1))} disabled={expensePage === totalExpensePages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </CardFooter>
        </Card>
      </div>

      <Dialog open={isPaymentDetailDialogOpen} onOpenChange={setIsPaymentDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalles del Pago</DialogTitle><DialogDescription>Resumen del pago de comisiones para el período {selectedPayment?.period}.</DialogDescription></DialogHeader>
          {selectedPayment && (
            <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="space-y-1">
                <p><span className="font-semibold">Fecha de Pago:</span> {format(new Date(selectedPayment.paymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</p>
                <p><span className="font-semibold">ID de Transacción:</span> <span className="font-mono text-xs">{selectedPayment.transactionId}</span></p>
              </div><Separator/>
              <div><h4 className="font-semibold mb-2">Comprobante de Pago de SUMA</h4><div className="relative aspect-video"><Image src={selectedPayment.paymentProofUrl} alt="Comprobante de pago" fill className="rounded-md border object-contain" data-ai-hint="payment receipt"/></div></div><Separator/>
              <div>
                <h4 className="font-semibold mb-2">Desglose de la Comisión</h4>
                <Table><TableHeader><TableRow><TableHead>Médico</TableHead><TableHead className="text-right">Comisión Generada</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedPayment.includedDoctors.map(doc => (<TableRow key={doc.id}><TableCell>{doc.name}</TableCell><TableCell className="text-right font-mono">${doc.commissionAmount.toFixed(2)}</TableCell></TableRow>))}
                  </TableBody>
                  <TableFooter><TableRow><TableCell className="font-bold">Total Recibido</TableCell><TableCell className="text-right font-bold text-green-600 text-lg font-mono">${selectedPayment.amount.toFixed(2)}</TableCell></TableRow></TableFooter>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}</DialogTitle><DialogDescription>Registra un nuevo gasto para llevar un control financiero.</DialogDescription></DialogHeader>
          <form onSubmit={handleSaveExpense}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDate" className="text-right">Fecha</Label><Input id="expenseDate" name="expenseDate" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseDescription" className="text-right">Descripción</Label><Input name="expenseDescription" defaultValue={editingExpense?.description} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="expenseAmount" className="text-right">Monto ($)</Label><Input name="expenseAmount" type="number" defaultValue={editingExpense?.amount} className="col-span-3" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar Gasto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className={cn('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90')}>
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
