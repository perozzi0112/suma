import { sendPushNotification } from './pushNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Enviar recordatorio de cita
export async function sendAppointmentReminder(
  userId: string,
  appointmentData: {
    id: string;
    date: Date;
    time: string;
    doctorName: string;
    specialty: string;
    patientName: string;
  }
): Promise<boolean> {
  try {
    const formattedDate = format(appointmentData.date, 'EEEE, d \'de\' MMMM', { locale: es });
    const formattedTime = appointmentData.time;
    
    const title = '📅 Recordatorio de cita médica';
    const body = `Tu cita con Dr. ${appointmentData.doctorName} (${appointmentData.specialty}) está programada para ${formattedDate} a las ${formattedTime}.`;
    
    return await sendPushNotification(
      userId,
      'appointment_reminder',
      title,
      body,
      {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        specialty: appointmentData.specialty,
        date: appointmentData.date.toISOString(),
        time: appointmentData.time,
        type: 'reminder'
      }
    );
  } catch (error) {
    console.error('Error al enviar recordatorio de cita:', error);
    return false;
  }
}

// Enviar confirmación de cita
export async function sendAppointmentConfirmation(
  userId: string,
  appointmentData: {
    id: string;
    date: Date;
    time: string;
    doctorName: string;
    specialty: string;
    patientName: string;
  }
): Promise<boolean> {
  try {
    const formattedDate = format(appointmentData.date, 'EEEE, d \'de\' MMMM', { locale: es });
    const formattedTime = appointmentData.time;
    
    const title = '✅ Cita confirmada';
    const body = `Tu cita con Dr. ${appointmentData.doctorName} (${appointmentData.specialty}) ha sido confirmada para ${formattedDate} a las ${formattedTime}.`;
    
    return await sendPushNotification(
      userId,
      'appointment_reminder',
      title,
      body,
      {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        specialty: appointmentData.specialty,
        date: appointmentData.date.toISOString(),
        time: appointmentData.time,
        type: 'confirmation'
      }
    );
  } catch (error) {
    console.error('Error al enviar confirmación de cita:', error);
    return false;
  }
}

// Enviar cancelación de cita
export async function sendAppointmentCancellation(
  userId: string,
  appointmentData: {
    id: string;
    date: Date;
    time: string;
    doctorName: string;
    specialty: string;
    patientName: string;
    reason?: string;
  }
): Promise<boolean> {
  try {
    const formattedDate = format(appointmentData.date, 'EEEE, d \'de\' MMMM', { locale: es });
    const formattedTime = appointmentData.time;
    
    const title = '❌ Cita cancelada';
    const body = `Tu cita con Dr. ${appointmentData.doctorName} (${appointmentData.specialty}) programada para ${formattedDate} a las ${formattedTime} ha sido cancelada.`;
    
    return await sendPushNotification(
      userId,
      'appointment_reminder',
      title,
      body,
      {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        specialty: appointmentData.specialty,
        date: appointmentData.date.toISOString(),
        time: appointmentData.time,
        type: 'cancellation',
        reason: appointmentData.reason || ''
      }
    );
  } catch (error) {
    console.error('Error al enviar cancelación de cita:', error);
    return false;
  }
}

// Enviar recordatorio 24 horas antes
export async function sendDayBeforeReminder(
  userId: string,
  appointmentData: {
    id: string;
    date: Date;
    time: string;
    doctorName: string;
    specialty: string;
    patientName: string;
  }
): Promise<boolean> {
  try {
    const formattedDate = format(appointmentData.date, 'EEEE, d \'de\' MMMM', { locale: es });
    const formattedTime = appointmentData.time;
    
    const title = '⏰ Cita mañana';
    const body = `Recuerda que mañana ${formattedDate} a las ${formattedTime} tienes cita con Dr. ${appointmentData.doctorName} (${appointmentData.specialty}).`;
    
    return await sendPushNotification(
      userId,
      'appointment_reminder',
      title,
      body,
      {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        specialty: appointmentData.specialty,
        date: appointmentData.date.toISOString(),
        time: appointmentData.time,
        type: 'day_before'
      }
    );
  } catch (error) {
    console.error('Error al enviar recordatorio del día anterior:', error);
    return false;
  }
}

// Enviar recordatorio 1 hora antes
export async function sendHourBeforeReminder(
  userId: string,
  appointmentData: {
    id: string;
    date: Date;
    time: string;
    doctorName: string;
    specialty: string;
    patientName: string;
  }
): Promise<boolean> {
  try {
    const formattedTime = appointmentData.time;
    
    const title = '🚀 Tu cita está próxima';
    const body = `En 1 hora tienes cita con Dr. ${appointmentData.doctorName} (${appointmentData.specialty}) a las ${formattedTime}. ¡Prepárate!`;
    
    return await sendPushNotification(
      userId,
      'appointment_reminder',
      title,
      body,
      {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        specialty: appointmentData.specialty,
        date: appointmentData.date.toISOString(),
        time: appointmentData.time,
        type: 'hour_before'
      }
    );
  } catch (error) {
    console.error('Error al enviar recordatorio de 1 hora:', error);
    return false;
  }
} 