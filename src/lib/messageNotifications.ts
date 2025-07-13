import { sendPushNotification } from './pushNotifications';

// Enviar notificación de nuevo mensaje
export async function sendNewMessageNotification(
  recipientId: string,
  messageData: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'doctor' | 'patient' | 'admin' | 'seller';
    content: string;
    timestamp: Date;
    conversationId: string;
  }
): Promise<boolean> {
  try {
    let title: string;
    let body: string;
    
    // Personalizar según el rol del remitente
    switch (messageData.senderRole) {
      case 'doctor':
        title = `👨‍⚕️ Dr. ${messageData.senderName}`;
        body = messageData.content.length > 50 
          ? `${messageData.content.substring(0, 50)}...` 
          : messageData.content;
        break;
      case 'patient':
        title = `👤 ${messageData.senderName}`;
        body = messageData.content.length > 50 
          ? `${messageData.content.substring(0, 50)}...` 
          : messageData.content;
        break;
      case 'admin':
        title = `🔔 Administración`;
        body = messageData.content.length > 50 
          ? `${messageData.content.substring(0, 50)}...` 
          : messageData.content;
        break;
      case 'seller':
        title = `💼 ${messageData.senderName}`;
        body = messageData.content.length > 50 
          ? `${messageData.content.substring(0, 50)}...` 
          : messageData.content;
        break;
      default:
        title = `💬 Nuevo mensaje`;
        body = messageData.content.length > 50 
          ? `${messageData.content.substring(0, 50)}...` 
          : messageData.content;
    }
    
    return await sendPushNotification(
      recipientId,
      'message',
      title,
      body,
      {
        messageId: messageData.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        conversationId: messageData.conversationId,
        timestamp: messageData.timestamp.toISOString(),
        type: 'new_message'
      }
    );
  } catch (error) {
    console.error('Error al enviar notificación de mensaje:', error);
    return false;
  }
}

// Enviar notificación de mensaje leído
export async function sendMessageReadNotification(
  senderId: string,
  messageData: {
    id: string;
    recipientId: string;
    recipientName: string;
    conversationId: string;
  }
): Promise<boolean> {
  try {
    const title = '👁️ Mensaje leído';
    const body = `${messageData.recipientName} ha leído tu mensaje.`;
    
    return await sendPushNotification(
      senderId,
      'message',
      title,
      body,
      {
        messageId: messageData.id,
        recipientId: messageData.recipientId,
        recipientName: messageData.recipientName,
        conversationId: messageData.conversationId,
        type: 'message_read'
      }
    );
  } catch (error) {
    console.error('Error al enviar notificación de mensaje leído:', error);
    return false;
  }
}

// Enviar notificación de mensaje importante
export async function sendImportantMessageNotification(
  recipientId: string,
  messageData: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'doctor' | 'patient' | 'admin' | 'seller';
    content: string;
    timestamp: Date;
    conversationId: string;
    priority: 'high' | 'urgent';
  }
): Promise<boolean> {
  try {
    const priorityIcon = messageData.priority === 'urgent' ? '🚨' : '⚠️';
    const title = `${priorityIcon} Mensaje importante`;
    const body = `${messageData.senderName}: ${messageData.content.length > 100 
      ? `${messageData.content.substring(0, 100)}...` 
      : messageData.content}`;
    
    return await sendPushNotification(
      recipientId,
      'message',
      title,
      body,
      {
        messageId: messageData.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        conversationId: messageData.conversationId,
        timestamp: messageData.timestamp.toISOString(),
        priority: messageData.priority,
        type: 'important_message'
      }
    );
  } catch (error) {
    console.error('Error al enviar notificación de mensaje importante:', error);
    return false;
  }
}

// Enviar notificación de mensaje de voz
export async function sendVoiceMessageNotification(
  recipientId: string,
  messageData: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'doctor' | 'patient' | 'admin' | 'seller';
    duration: number; // duración en segundos
    timestamp: Date;
    conversationId: string;
  }
): Promise<boolean> {
  try {
    const title = `🎤 ${messageData.senderName}`;
    const body = `Te envió un mensaje de voz (${messageData.duration}s)`;
    
    return await sendPushNotification(
      recipientId,
      'message',
      title,
      body,
      {
        messageId: messageData.id,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        conversationId: messageData.conversationId,
        timestamp: messageData.timestamp.toISOString(),
        duration: messageData.duration.toString(),
        type: 'voice_message'
      }
    );
  } catch (error) {
    console.error('Error al enviar notificación de mensaje de voz:', error);
    return false;
  }
} 