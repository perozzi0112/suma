'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, X, CheckCircle } from 'lucide-react';
import { generateGoogleCalendarLink } from '@/lib/calendar-utils';

interface CalendarNotificationProps {
  appointment: any;
  onClose: () => void;
}

export function CalendarNotification({ appointment, onClose }: CalendarNotificationProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCalendar = () => {
    setIsAdding(true);
    const calendarUrl = generateGoogleCalendarLink(appointment);
    window.open(calendarUrl, '_blank');
    
    // Simular que se agregó exitosamente
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1000);
  };

  if (isAdded) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-green-200 bg-green-50 animate-in slide-in-from-bottom-2">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">¡Agregado a tu calendario!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-blue-200 bg-blue-50 animate-in slide-in-from-bottom-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
            <Calendar className="h-4 w-4" />
            ¿Agregar a tu calendario?
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-blue-700 mb-3">
          Tu cita con <strong>Dr. {appointment.doctorName}</strong><br />
          <span className="text-blue-600">
            {appointment.date} a las {appointment.time}
          </span>
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddToCalendar}
            disabled={isAdding}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isAdding ? 'Abriendo...' : 'Agregar a Google Calendar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            No, gracias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 