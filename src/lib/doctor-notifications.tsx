
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment, DoctorNotification, AdminSupportTicket, DoctorPayment } from './types';
import { useAuth } from './auth';
import { batchUpdateDoctorAppointmentsAsRead, batchUpdateDoctorNotificationsAsRead } from './firestoreService';

interface DoctorNotificationContextType {
  doctorNotifications: DoctorNotification[];
  doctorUnreadCount: number;
  checkAndSetDoctorNotifications: (
    appointments: Appointment[], 
    supportTickets: AdminSupportTicket[], 
    doctorPayments: DoctorPayment[]
  ) => void;
  markDoctorNotificationsAsRead: () => void;
}

const DoctorNotificationContext = createContext<DoctorNotificationContextType | undefined>(undefined);
const getNotificationStorageKey = (userId: string) => `suma-doctor-notifications-${userId}`;

export function DoctorNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [doctorNotifications, setDoctorNotifications] = useState<DoctorNotification[]>([]);
  const [doctorUnreadCount, setDoctorUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id && user.role === 'doctor') {
      try {
        const storageKey = getNotificationStorageKey(user.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as DoctorNotification[];
          setDoctorNotifications(parsed);
          setDoctorUnreadCount(parsed.filter(n => !n.read).length);
        } else {
          setDoctorNotifications([]);
          setDoctorUnreadCount(0);
        }
      } catch (e) {
        console.error("Failed to load doctor notifications from localStorage", e);
        setDoctorNotifications([]);
        setDoctorUnreadCount(0);
      }
    } else {
      setDoctorNotifications([]);
      setDoctorUnreadCount(0);
    }
  }, [user]);

  const checkAndSetDoctorNotifications = useCallback((
    appointments: Appointment[], 
    supportTickets: AdminSupportTicket[],
    doctorPayments: DoctorPayment[]
  ) => {
    if (!user?.id || user.role !== 'doctor') return;

    const storageKey = getNotificationStorageKey(user.id);
    const newNotificationsMap = new Map<string, DoctorNotification>();
    const now = new Date();
    
    const existingIds = new Set(doctorNotifications.map(n => n.id));

    // --- Generate Notifications ---

    appointments.forEach(appt => {
      // 1. New Appointment
      if (appt.readByDoctor === false) {
        const id = `new-appt-${appt.id}`;
        if (!existingIds.has(id)) {
            newNotificationsMap.set(id, {
                id, type: 'new_appointment', title: '¡Nueva Cita Agendada!',
                description: `El paciente ${appt.patientName} ha reservado para el ${appt.date}.`,
                date: appt.date, createdAt: now.toISOString(), read: false,
                link: `/doctor/dashboard?view=appointments`
            });
        }
      }

      // 2. Payment Verification needed from you
      if (appt.paymentMethod === 'transferencia' && appt.paymentStatus === 'Pendiente') {
        const id = `verify-${appt.id}`;
        if (!existingIds.has(id)) {
            newNotificationsMap.set(id, {
                id, type: 'payment_verification', title: 'Verificación de Pago',
                description: `El paciente ${appt.patientName} espera aprobación.`,
                date: appt.date, createdAt: now.toISOString(), read: false,
                link: `/doctor/dashboard?view=appointments`
            });
        }
      }
      // 3. Patient Confirmation status change
      if (appt.patientConfirmationStatus === 'Confirmada' || appt.patientConfirmationStatus === 'Cancelada') {
         const id = `confirm-${appt.id}-${appt.patientConfirmationStatus}`;
         if (!existingIds.has(id)) {
             newNotificationsMap.set(id, {
                 id, type: appt.patientConfirmationStatus === 'Confirmada' ? 'patient_confirmed' : 'patient_cancelled',
                 title: `Cita ${appt.patientConfirmationStatus}`,
                 description: `${appt.patientName} ha ${appt.patientConfirmationStatus.toLowerCase()} su cita.`,
                 date: new Date().toISOString(), createdAt: now.toISOString(), read: false,
                 link: `/doctor/dashboard?view=appointments`
             });
         }
      }
      // 4. New Messages from patient
      const lastMessage = appt.messages?.slice(-1)[0];
      if (lastMessage?.sender === 'patient') {
          const id = `msg-${appt.id}-${lastMessage.id}`;
          if (!existingIds.has(id)) {
              newNotificationsMap.set(id, {
                  id, type: 'new_message', title: `Nuevo Mensaje de ${appt.patientName}`,
                  description: lastMessage.text.substring(0, 50) + '...',
                  date: lastMessage.timestamp, createdAt: now.toISOString(), read: false,
                  link: `/doctor/dashboard?view=appointments`
              });
          }
      }
    });

    // 5. Subscription payment update from admin
    doctorPayments.forEach(payment => {
        if ((payment.status === 'Paid' || payment.status === 'Rejected') && !payment.readByDoctor) {
            const id = `sub-${payment.id}-${payment.status}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id, type: 'subscription_update',
                    title: `Suscripción ${payment.status === 'Paid' ? 'Aprobada' : 'Rechazada'}`,
                    description: `Tu pago de $${payment.amount.toFixed(2)} ha sido ${payment.status === 'Paid' ? 'aprobado' : 'rechazado'}.`,
                    date: payment.date, createdAt: now.toISOString(), read: false,
                    link: '/doctor/dashboard?view=subscription'
                });
            }
        }
    });

    // 6. Support Ticket Replies from admin
    supportTickets.forEach(ticket => {
        const lastMessage = ticket.messages?.slice(-1)[0];
        if (lastMessage?.sender === 'admin' && ticket.userId === user.email && !ticket.readByDoctor) {
            const id = `support-${ticket.id}-${lastMessage.id}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id, type: 'support_reply',
                    title: `Respuesta de Soporte`,
                    description: `El equipo de SUMA ha respondido a tu ticket: "${ticket.subject}"`,
                    date: lastMessage.timestamp, createdAt: now.toISOString(), read: false,
                    link: `/doctor/dashboard?view=support`
                });
            }
        }
    });
    // --- End Generate Notifications ---


    if (newNotificationsMap.size > 0) {
      const uniqueNewNotifications = Array.from(newNotificationsMap.values());
      const updatedNotifications = [...uniqueNewNotifications, ...doctorNotifications]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      setDoctorNotifications(updatedNotifications);
      setDoctorUnreadCount(prev => prev + uniqueNewNotifications.length);
    }
  }, [doctorNotifications, user]);

  const markDoctorNotificationsAsRead = useCallback(async () => {
    if (!user?.id || user.role !== 'doctor' || doctorUnreadCount === 0) return;
    
    const storageKey = getNotificationStorageKey(user.id);
    const updated = doctorNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setDoctorNotifications(updated);
    setDoctorUnreadCount(0);
    
    const unreadNotifications = doctorNotifications.filter(n => !n.read);
    if(unreadNotifications.length === 0) return;

    const appointmentIdsToUpdate = unreadNotifications
        .filter(n => n.type === 'new_appointment')
        .map(n => n.id.replace('new-appt-', ''));
    
    const paymentIdsToUpdate = unreadNotifications
        .filter(n => n.type === 'subscription_update')
        .map(n => n.id.split('-')[1]);

    const ticketIdsToUpdate = unreadNotifications
      .filter(n => n.type === 'support_reply')
      .map(n => n.id.split('-')[1]);
        
    await batchUpdateDoctorAppointmentsAsRead(appointmentIdsToUpdate);
    await batchUpdateDoctorNotificationsAsRead(paymentIdsToUpdate, ticketIdsToUpdate);

  }, [doctorNotifications, user, doctorUnreadCount]);
  
  const value = { doctorNotifications, doctorUnreadCount, checkAndSetDoctorNotifications, markDoctorNotificationsAsRead };

  // --- NUEVO: Actualización automática de notificaciones cada 30 segundos ---
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    async function fetchAndCheck() {
      if (user?.id && user.role === 'doctor') {
        // Importación dinámica para evitar ciclo circular
        const { getDoctorAppointments, getSupportTickets, getDoctorPayments } = await import('./firestoreService');
        const [appointments, supportTickets, doctorPayments] = await Promise.all([
          getDoctorAppointments(user.id),
          getSupportTickets(),
          getDoctorPayments()
        ]);
        checkAndSetDoctorNotifications(appointments, supportTickets, doctorPayments);
      }
    }
    if (user?.id && user.role === 'doctor') {
      interval = setInterval(fetchAndCheck, 30000); // cada 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, checkAndSetDoctorNotifications]);

  return (
    <DoctorNotificationContext.Provider value={value}>
      {children}
    </DoctorNotificationContext.Provider>
  );
}

export function useDoctorNotifications() {
  const context = useContext(DoctorNotificationContext);
  if (context === undefined) {
    throw new Error('useDoctorNotifications must be used within a DoctorNotificationProvider');
  }
  return context;
}
