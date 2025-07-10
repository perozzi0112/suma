
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { SellerNotification, AdminSupportTicket, SellerPayment, Doctor } from './types';
import { useAuth } from './auth';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

interface SellerNotificationContextType {
  sellerNotifications: SellerNotification[];
  sellerUnreadCount: number;
  checkAndSetSellerNotifications: (
      sellerPayments: SellerPayment[],
      supportTickets: AdminSupportTicket[],
      referredDoctors: Doctor[]
  ) => void;
  markSellerNotificationsAsRead: () => void;
}

const SellerNotificationContext = createContext<SellerNotificationContextType | undefined>(undefined);
const getNotificationStorageKey = (userId: string) => `suma-seller-notifications-${userId}`;

export function SellerNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sellerNotifications, setSellerNotifications] = useState<SellerNotification[]>([]);
  const [sellerUnreadCount, setSellerUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id && user.role === 'seller') {
      try {
        const storageKey = getNotificationStorageKey(user.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as SellerNotification[];
          setSellerNotifications(parsed);
          setSellerUnreadCount(parsed.filter(n => !n.read).length);
        }
      } catch (e) {
        console.error("Failed to load seller notifications from localStorage", e);
      }
    }
  }, [user]);

  const checkAndSetSellerNotifications = useCallback((
      sellerPayments: SellerPayment[],
      supportTickets: AdminSupportTicket[],
      referredDoctors: Doctor[]
  ) => {
    if (!user?.id || user.role !== 'seller') return;

    const storageKey = getNotificationStorageKey(user.id);
    const newNotificationsMap = new Map<string, SellerNotification>();
    const now = new Date();
    
    const existingIds = new Set(sellerNotifications.map(n => n.id));

    // 1. New Doctor Registered
    referredDoctors.forEach(doc => {
        if (!doc.readBySeller) {
            const id = `new-doctor-${doc.id}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id,
                    type: 'new_doctor_registered',
                    title: '¡Nuevo Referido!',
                    description: `El Dr. ${doc.name} se ha registrado con tu código.`,
                    date: doc.joinDate,
                    createdAt: now.toISOString(),
                    read: false,
                    link: '/seller/dashboard?view=referrals'
                });
            }
        }
    });

    // 2. Payment Processed
    sellerPayments.forEach(payment => {
        if (!payment.readBySeller) {
            const id = `payment-processed-${payment.id}`;
            if (!existingIds.has(id)) {
                newNotificationsMap.set(id, {
                    id,
                    type: 'payment_processed',
                    title: '¡Has recibido un pago!',
                    description: `SUMA te ha pagado $${payment.amount.toFixed(2)} por tus comisiones de ${payment.period}.`,
                    date: payment.paymentDate,
                    createdAt: now.toISOString(),
                    read: false,
                    link: '/seller/dashboard?view=finances'
                });
            }
        }
    });

    // 3. Support Ticket Replies
    supportTickets.forEach(ticket => {
        if (ticket.userRole === 'seller' && ticket.userId === user.email && !ticket.readBySeller) {
             const lastMessage = ticket.messages?.slice(-1)[0];
             if (lastMessage?.sender === 'admin') {
                const id = `support-reply-${ticket.id}-${lastMessage.id}`;
                if (!existingIds.has(id)) {
                    newNotificationsMap.set(id, {
                        id,
                        type: 'support_reply',
                        title: 'Respuesta de Soporte',
                        description: `El equipo de SUMA ha respondido a tu ticket: "${ticket.subject}"`,
                        date: lastMessage.timestamp,
                        createdAt: now.toISOString(),
                        read: false,
                        link: '/seller/dashboard?view=support'
                    });
                }
             }
        }
    });

    if (newNotificationsMap.size > 0) {
      const uniqueNewNotifications = Array.from(newNotificationsMap.values());
      const updatedNotifications = [...uniqueNewNotifications, ...sellerNotifications]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      setSellerNotifications(updatedNotifications);
      setSellerUnreadCount(prev => prev + uniqueNewNotifications.length);
    }
  }, [user, sellerNotifications]);

  const markSellerNotificationsAsRead = useCallback(async () => {
    if (!user?.id || user.role !== 'seller' || sellerUnreadCount === 0) return;
    
    const storageKey = getNotificationStorageKey(user.id);
    const updated = sellerNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSellerNotifications(updated);
    setSellerUnreadCount(0);
    
    const unreadNotifications = sellerNotifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const doctorIds = unreadNotifications.filter(n => n.type === 'new_doctor_registered').map(n => n.id.replace('new-doctor-',''));
    const paymentIds = unreadNotifications.filter(n => n.type === 'payment_processed').map(n => n.id.replace('payment-processed-',''));
    const ticketIds = unreadNotifications.filter(n => n.type === 'support_reply').map(n => n.id.split('-')[2]);

    const batch = writeBatch(db);
    doctorIds.forEach(id => batch.update(doc(db, "doctors", id), { readBySeller: true }));
    paymentIds.forEach(id => batch.update(doc(db, "sellerPayments", id), { readBySeller: true }));
    ticketIds.forEach(id => batch.update(doc(db, "supportTickets", id), { readBySeller: true }));

    try {
        await batch.commit();
    } catch (e) {
        console.error("Failed to mark seller notifications as read in Firestore", e);
    }

  }, [sellerNotifications, user, sellerUnreadCount]);
  
  const value = { sellerNotifications, sellerUnreadCount, checkAndSetSellerNotifications, markSellerNotificationsAsRead };

  // --- NUEVO: Actualización automática de notificaciones cada 30 segundos ---
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    async function fetchAndCheck() {
      if (user?.id && user.role === 'seller') {
        // Importación dinámica para evitar ciclo circular
        const { getSellerPayments, getSupportTickets, getDoctors } = await import('./firestoreService');
        const [sellerPayments, supportTickets, referredDoctors] = await Promise.all([
          getSellerPayments(),
          getSupportTickets(),
          getDoctors()
        ]);
        checkAndSetSellerNotifications(sellerPayments, supportTickets, referredDoctors);
      }
    }
    if (user?.id && user.role === 'seller') {
      interval = setInterval(fetchAndCheck, 30000); // cada 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, checkAndSetSellerNotifications]);

  return (
    <SellerNotificationContext.Provider value={value}>
      {children}
    </SellerNotificationContext.Provider>
  );
}

export function useSellerNotifications() {
  const context = useContext(SellerNotificationContext);
  if (context === undefined) {
    throw new Error('useSellerNotifications must be used within a SellerNotificationProvider');
  }
  return context;
}
