
"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Doctor, Seller, Patient, DoctorPayment, SellerPayment, CompanyExpense } from "@/lib/types";
import * as firestoreService from '@/lib/firestoreService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Stethoscope, UserCheck, BarChart as BarChartIcon, Loader2 } from 'lucide-react';

export function OverviewTab() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalSellers: 0,
    totalPatients: 0,
    netProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [doctors, sellers, patients, doctorPayments, sellerPayments, settings] = await Promise.all([
        firestoreService.getDoctors(),
        firestoreService.getSellers(),
        firestoreService.getPatients(),
        firestoreService.getDoctorPayments(),
        firestoreService.getSellerPayments(),
        firestoreService.getSettings(),
      ]);

      const companyExpenses = settings?.companyExpenses || [];

      const totalDoctors = doctors.length;
      const activeDoctors = doctors.filter(d => d.status === 'active').length;
      const totalSellers = sellers.length;
      const totalPatients = patients.length;
      
      const totalRevenue = doctorPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
      const commissionsPaid = sellerPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalExpensesValue = companyExpenses.reduce((sum, e) => sum + e.amount, 0);

      setStats({
          totalDoctors, activeDoctors, totalSellers, totalPatients,
          netProfit: totalRevenue - commissionsPaid - totalExpensesValue,
      });
    } catch (error) {
      console.error("Failed to fetch overview stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Médicos</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                <p className="text-xs text-muted-foreground">{stats.activeDoctors} activos</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendedoras</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalSellers}</div>
                <p className="text-xs text-muted-foreground">Gestionando referidos</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${stats.netProfit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Ingresos - Egresos (Global)</p>
            </CardContent>
        </Card>
      </div>
      <div className="mt-6 text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
          <BarChartIcon className="h-12 w-12" />
          <h3 className="text-xl font-semibold">Gráficos y Analíticas</h3>
          <p>Más analíticas detalladas sobre el crecimiento y uso de la plataforma estarán disponibles aquí.</p>
      </div>
    </div>
  );
}
