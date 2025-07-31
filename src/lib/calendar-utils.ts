export function generateGoogleCalendarLink(appointment: any) {
  const event = {
    text: `Cita con Dr. ${appointment.doctorName}`,
    dates: `${appointment.date}T${appointment.time}/${appointment.date}T${getEndTime(appointment.time)}`,
    details: `Servicios: ${appointment.services.join(', ')}\nPrecio: $${appointment.totalPrice}\nDirección: ${appointment.doctorAddress || 'Consultorio'}`,
    location: appointment.doctorAddress || 'Consultorio',
  };

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.text);
  url.searchParams.set('dates', event.dates);
  url.searchParams.set('details', event.details);
  url.searchParams.set('location', event.location);

  return url.toString();
}

function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':');
  const endHour = parseInt(hours) + 1;
  return `${endHour.toString().padStart(2, '0')}:${minutes}`;
} 