
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import * as firestoreService from './firestoreService';
import type { Appointment } from './types';
import { useAuth } from './auth';

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (newAppointmentData: Omit<Appointment, 'id'| 'patientId' | 'patientName'>) => Promise<void>;
  updateAppointmentConfirmation: (appointmentId: string, status: 'Confirmada' | 'Cancelada') => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (user?.role === 'patient' && user.id) {
      const patientAppointments = await firestoreService.getPatientAppointments(user.id);
      setAppointments(patientAppointments);
    } else {
      setAppointments([]);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Actualización automática cada 30 segundos para pacientes
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (user?.role === 'patient' && user.id) {
      interval = setInterval(fetchAppointments, 30000); // cada 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, fetchAppointments]);

  const addAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName'>) => {
    if (!user || user.role !== 'patient') return; 

    const newAppointment: Omit<Appointment, 'id'> = {
      ...newAppointmentData,
      patientId: user.id,
      patientName: user.name,
    };
    
    await firestoreService.addAppointment(newAppointment);
    await fetchAppointments();
  }, [user, fetchAppointments]);

  const updateAppointmentConfirmation = useCallback(async (appointmentId: string, status: 'Confirmada' | 'Cancelada') => {
    await firestoreService.updateAppointment(appointmentId, { patientConfirmationStatus: status });
    await fetchAppointments();
  }, [fetchAppointments]);

  const refreshAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  const value = { appointments, addAppointment, updateAppointmentConfirmation, refreshAppointments };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}
