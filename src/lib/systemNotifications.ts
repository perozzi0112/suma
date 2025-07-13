import { sendPushNotification } from './pushNotifications';

// Enviar notificación de nuevo usuario registrado
export async function sendNewUserNotification(
  adminIds: string[],
  userData: {
    id: string;
    name: string;
    email: string;
    role: 'doctor' | 'patient' | 'seller';
    registrationDate: Date;
  }
): Promise<boolean[]> {
  try {
    const roleLabels = {
      doctor: 'médico',
      patient: 'paciente',
      seller: 'vendedor'
    };
    
    const title = '👤 Nuevo usuario registrado';
    const body = `${userData.name} (${userData.email}) se ha registrado como ${roleLabels[userData.role]}.`;
    
    const promises = adminIds.map(adminId => 
      sendPushNotification(
        adminId,
        'system',
        title,
        body,
        {
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          userRole: userData.role,
          registrationDate: userData.registrationDate.toISOString(),
          type: 'new_user'
        }
      )
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación de nuevo usuario:', error);
    return adminIds.map(() => false);
  }
}

// Enviar notificación de pago recibido
export async function sendPaymentNotification(
  adminIds: string[],
  paymentData: {
    id: string;
    amount: number;
    currency: string;
    payerName: string;
    payerRole: 'doctor' | 'seller';
    paymentMethod: string;
    timestamp: Date;
  }
): Promise<boolean[]> {
  try {
    const title = '💰 Pago recibido';
    const body = `${paymentData.payerName} ha realizado un pago de ${paymentData.amount} ${paymentData.currency} por ${paymentData.paymentMethod}.`;
    
    const promises = adminIds.map(adminId => 
      sendPushNotification(
        adminId,
        'system',
        title,
        body,
        {
          paymentId: paymentData.id,
          amount: paymentData.amount.toString(),
          currency: paymentData.currency,
          payerName: paymentData.payerName,
          payerRole: paymentData.payerRole,
          paymentMethod: paymentData.paymentMethod,
          timestamp: paymentData.timestamp.toISOString(),
          type: 'payment_received'
        }
      )
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación de pago:', error);
    return adminIds.map(() => false);
  }
}

// Enviar notificación de ticket de soporte
export async function sendSupportTicketNotification(
  adminIds: string[],
  ticketData: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    userEmail: string;
    userName: string;
    timestamp: Date;
  }
): Promise<boolean[]> {
  try {
    const priorityIcons = {
      low: '📝',
      medium: '⚠️',
      high: '🚨',
      urgent: '🔥'
    };
    
    const title = `${priorityIcons[ticketData.priority]} Nuevo ticket de soporte`;
    const body = `${ticketData.userName}: ${ticketData.title}`;
    
    const promises = adminIds.map(adminId => 
      sendPushNotification(
        adminId,
        'system',
        title,
        body,
        {
          ticketId: ticketData.id,
          ticketTitle: ticketData.title,
          ticketDescription: ticketData.description,
          priority: ticketData.priority,
          userEmail: ticketData.userEmail,
          userName: ticketData.userName,
          timestamp: ticketData.timestamp.toISOString(),
          type: 'support_ticket'
        }
      )
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación de ticket de soporte:', error);
    return adminIds.map(() => false);
  }
}

// Enviar notificación de error del sistema
export async function sendSystemErrorNotification(
  adminIds: string[],
  errorData: {
    id: string;
    error: string;
    component: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }
): Promise<boolean[]> {
  try {
    const severityIcons = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '💥'
    };
    
    const title = `${severityIcons[errorData.severity]} Error del sistema`;
    const body = `Error en ${errorData.component}: ${errorData.error.substring(0, 100)}...`;
    
    const promises = adminIds.map(adminId => 
      sendPushNotification(
        adminId,
        'system',
        title,
        body,
        {
          errorId: errorData.id,
          error: errorData.error,
          component: errorData.component,
          severity: errorData.severity,
          timestamp: errorData.timestamp.toISOString(),
          type: 'system_error'
        }
      )
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación de error del sistema:', error);
    return adminIds.map(() => false);
  }
}

// Enviar notificación de mantenimiento
export async function sendMaintenanceNotification(
  userIds: string[],
  maintenanceData: {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    severity: 'scheduled' | 'emergency';
  }
): Promise<boolean[]> {
  try {
    const severityIcon = maintenanceData.severity === 'emergency' ? '🚨' : '🔧';
    const title = `${severityIcon} Mantenimiento del sistema`;
    const body = `${maintenanceData.title}: ${maintenanceData.description}`;
    
    const promises = userIds.map(userId => 
      sendPushNotification(
        userId,
        'system',
        title,
        body,
        {
          maintenanceId: maintenanceData.id,
          title: maintenanceData.title,
          description: maintenanceData.description,
          startTime: maintenanceData.startTime.toISOString(),
          endTime: maintenanceData.endTime.toISOString(),
          severity: maintenanceData.severity,
          type: 'maintenance'
        }
      )
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación de mantenimiento:', error);
    return userIds.map(() => false);
  }
} 