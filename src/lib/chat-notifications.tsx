"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Appointment } from './types';
import { useAuth } from './auth';

interface ChatNotificationContextType {
  unreadChatCount: number;
  updateUnreadChatCount: (appointments: Appointment[]) => void;
  markChatAsRead: (appointmentId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext);
  if (context === undefined) {
    throw new Error('useChatNotifications must be used within a ChatNotificationProvider');
  }
  return context;
}

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const updateUnreadChatCount = useCallback((appointments: Appointment[]) => {
    if (!user?.id) return;

    let totalUnread = 0;
    console.log('🔍 Actualizando contador de chat no leído para:', user.role);
    console.log('📋 Total de citas:', appointments.length);

    appointments.forEach(appointment => {
      if (!appointment.messages || appointment.messages.length === 0) return;

      const lastMessage = appointment.messages[appointment.messages.length - 1];
      console.log(`💬 Cita ${appointment.id}: último mensaje de ${lastMessage.sender}, leído por doctor: ${appointment.readByDoctor}, leído por paciente: ${appointment.readByPatient}`);
      
      if (user.role === 'doctor') {
        // Para el doctor, contar mensajes del paciente no leídos
        if (lastMessage.sender === 'patient') {
          // Si el último mensaje es del paciente y no ha sido leído por el doctor
          if (!appointment.readByDoctor) {
            totalUnread += 1;
            console.log(`🔴 Doctor: mensaje no leído de ${appointment.patientName}`);
          }
        }
      } else if (user.role === 'patient') {
        // Para el paciente, contar mensajes del doctor no leídos
        if (lastMessage.sender === 'doctor') {
          // Si el último mensaje es del doctor y no ha sido leído por el paciente
          if (!appointment.readByPatient) {
            totalUnread += 1;
            console.log(`🔴 Paciente: mensaje no leído de ${appointment.doctorName}`);
          }
        }
      }
    });

    console.log(`📊 Total de mensajes no leídos: ${totalUnread}`);
    setUnreadChatCount(totalUnread);
  }, [user]);

  const markChatAsRead = useCallback((appointmentId: string) => {
    // Esta función se puede expandir para marcar mensajes como leídos en Firestore
    console.log(`Marking chat as read for appointment: ${appointmentId}`);
  }, []);

  const value = {
    unreadChatCount,
    updateUnreadChatCount,
    markChatAsRead
  };

  return (
    <ChatNotificationContext.Provider value={value}>
      {children}
    </ChatNotificationContext.Provider>
  );
} 