// Script para limpiar notificaciones incorrectas del localStorage
export function clearAllNotifications() {
  const allKeys = Object.keys(localStorage);
  
  // Limpiar todas las notificaciones de todos los tipos de usuario
  const notificationKeys = allKeys.filter(key => 
    key.startsWith('suma-doctor-notifications-') ||
    key.startsWith('suma-seller-notifications-') ||
    key.startsWith('suma-patient-notifications-')
  );
  
  notificationKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed notification key: ${key}`);
  });
  
  console.log(`Cleared ${notificationKeys.length} notification keys from localStorage`);
}

// Función para limpiar notificaciones de un usuario específico
export function clearUserNotifications(userId: string, userRole: 'doctor' | 'seller' | 'patient') {
  const prefix = `suma-${userRole}-notifications-`;
  const userKey = `${prefix}${userId}`;
  
  // Limpiar notificaciones de este usuario específico
  localStorage.removeItem(userKey);
  console.log(`Cleared notifications for ${userRole} ${userId}`);
}

// Función para limpiar notificaciones de otros usuarios (mantener solo las del usuario actual)
export function clearOtherUsersNotifications(currentUserId: string, currentUserRole: 'doctor' | 'seller' | 'patient') {
  const allKeys = Object.keys(localStorage);
  const currentUserKey = `suma-${currentUserRole}-notifications-${currentUserId}`;
  
  const otherUserKeys = allKeys.filter(key => 
    (key.startsWith('suma-doctor-notifications-') ||
     key.startsWith('suma-seller-notifications-') ||
     key.startsWith('suma-patient-notifications-')) &&
    key !== currentUserKey
  );
  
  otherUserKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed other user notification key: ${key}`);
  });
  
  console.log(`Cleared ${otherUserKeys.length} other user notification keys`);
} 