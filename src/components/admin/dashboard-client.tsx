"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useAdminNotifications } from '@/lib/admin-notifications';
import { Loader2 } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { DoctorsTab } from './tabs/doctors-tab';
import { SellersTab } from './tabs/sellers-tab';
import { PatientsTab } from './tabs/patients-tab';
import { FinancesTab } from './tabs/finances-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { SupportTab } from './tabs/support-tab';
import { SettingsTab } from './tabs/settings-tab';
import { Skeleton } from '../ui/skeleton';

export function AdminDashboardClient({ currentTab = 'overview' }: { currentTab?: string }) {
  const { user, loading } = useAuth();
  const { checkAndSetAdminNotifications } = useAdminNotifications();
  const router = useRouter();

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Actualizar notificaciones cuando el usuario cambie
  useEffect(() => {
    if (user?.role === 'admin') {
      // Las notificaciones del administrador se actualizan automáticamente cada 30 segundos
      // desde el AdminNotificationProvider
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 container py-12">
        <div className="mb-8">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex-1 container py-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Redirigiendo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el contenido específico según el tab actual
  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewTab />;
      case 'doctors':
        return <DoctorsTab />;
      case 'sellers':
        return <SellersTab />;
      case 'patients':
        return <PatientsTab />;
      case 'finances':
        return <FinancesTab />;
      case 'marketing':
        return <MarketingTab />;
      case 'support':
        return <SupportTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="flex-1 container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Gestiona tu plataforma médica desde aquí.
        </p>
      </div>
      
      {renderContent()}
    </div>
  );
}
