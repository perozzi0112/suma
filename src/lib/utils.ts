import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para obtener la fecha actual en la zona horaria de Venezuela
export function getCurrentDateInVenezuela(): string {
  const now = new Date();
  // Venezuela está en GMT-4 (sin horario de verano)
  // Convertir a zona horaria de Venezuela
  const venezuelaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Caracas"}));
  return venezuelaTime.toISOString().split('T')[0];
}

// Función para convertir una fecha UTC a fecha de Venezuela
export function convertUTCToVenezuelaDate(utcDate: Date): string {
  // Convertir a zona horaria de Venezuela
  const venezuelaTime = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Caracas"}));
  return venezuelaTime.toISOString().split('T')[0];
}

// Función para obtener la fecha de pago basada en la fecha de registro en Venezuela
export function getPaymentDateInVenezuela(joinDate: Date): string {
  // Convertir la fecha de registro a zona horaria de Venezuela
  const venezuelaDate = new Date(joinDate.toLocaleString("en-US", {timeZone: "America/Caracas"}));
  const dayOfMonth = venezuelaDate.getDate();
  
  // Calcular la fecha de pago
  const paymentDate = new Date(venezuelaDate.getFullYear(), venezuelaDate.getMonth(), 1);
  if (dayOfMonth < 15) {
    // Si se registra antes del 15, paga el 1 del mes siguiente
    paymentDate.setMonth(paymentDate.getMonth() + 1);
  } else {
    // Si se registra el 15 o después, paga el 1 del mes subsiguiente
    paymentDate.setMonth(paymentDate.getMonth() + 2);
  }
  
  return paymentDate.toISOString().split('T')[0];
}

// Función para obtener la fecha y hora actual en Venezuela
export function getCurrentDateTimeInVenezuela(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: "America/Caracas"}));
}

// Función para formatear una fecha en zona horaria de Venezuela
export function formatDateInVenezuela(date: Date): string {
  const venezuelaDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Caracas"}));
  return venezuelaDate.toISOString().split('T')[0];
}
