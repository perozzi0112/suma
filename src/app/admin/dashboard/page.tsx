"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminDashboardClient } from '@/components/admin/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderWrapper } from '@/components/header';
import { useAuth } from '@/lib/auth';

function DashboardLoading() {
  return (
    <div className="flex-1 container py-12">
      <div className="mb-8">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
      </div>
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'overview';
  const { } = useAuth();

  return <AdminDashboardClient currentTab={currentTab} />;
}

export default function AdminDashboardPageWrapper() {
  return (
    <>
      <HeaderWrapper />
      <main className="flex-1">
        <Suspense fallback={<DashboardLoading />}>
          <AdminDashboardPage />
        </Suspense>
      </main>
    </>
  );
}
