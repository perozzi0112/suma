"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DoctorDashboardClient } from '@/components/doctor/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderWrapper } from '@/components/header';

function DashboardLoading() {
    return (
      <>
        <HeaderWrapper />
        <main className="flex-1 container py-12">
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
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </>
    );
}

function DoctorDashboardPage() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('view') || 'appointments';
    return <DoctorDashboardClient currentTab={currentTab} />;
}

export default function DoctorDashboardPageWrapper() {
  return (
    <Suspense fallback={<DashboardLoading />}>
        <DoctorDashboardPage />
    </Suspense>
  );
}
