
"use client";

import { useState } from 'react';
import type { Schedule } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';

interface ScheduleTabProps {
  doctorData: {
    id: string;
    schedule: Schedule;
  };
  onScheduleUpdate: () => void;
}

const dayLabels: Record<keyof Schedule, string> = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
const daysOfWeek: (keyof Schedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ScheduleTab({ doctorData, onScheduleUpdate }: ScheduleTabProps) {
  const { toast } = useToast();
  const [tempSchedule, setTempSchedule] = useState<Schedule | null>(doctorData.schedule);
  const [isScheduleSaved, setIsScheduleSaved] = useState(true);

  const handleScheduleChange = (day: keyof Schedule, field: 'active' | 'slot', value: unknown, slotIndex?: number) => {
    if (!tempSchedule) return;
    const newSchedule = { ...tempSchedule };
    if (field === 'active') {
        newSchedule[day].active = Boolean(value);
    } else if (field === 'slot' && slotIndex !== undefined) {
        if (typeof value === 'object' && value !== null) {
          newSchedule[day].slots[slotIndex] = value as { start: string; end: string };
        }
    }
    setTempSchedule(newSchedule);
    setIsScheduleSaved(false);
  };

  const handleAddSlot = (day: keyof Schedule) => {
    if (!tempSchedule) return;
    const newSchedule = { ...tempSchedule };
    newSchedule[day].slots.push({ start: '09:00', end: '10:00' });
    setTempSchedule(newSchedule);
    setIsScheduleSaved(false);
  };

  const handleRemoveSlot = (day: keyof Schedule, slotIndex: number) => {
    if (!tempSchedule) return;
    const newSchedule = { ...tempSchedule };
    newSchedule[day].slots.splice(slotIndex, 1);
    setTempSchedule(newSchedule);
    setIsScheduleSaved(false);
  };
  
  const handleSaveSchedule = async () => {
    if(!doctorData || !tempSchedule) return;
    await firestoreService.updateDoctor(doctorData.id, { schedule: tempSchedule });
    toast({ title: 'Horario Guardado', description: 'Tu disponibilidad ha sido actualizada.' });
    setIsScheduleSaved(true);
    onScheduleUpdate();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <CardTitle>Mi Horario</CardTitle>
        <Button onClick={handleSaveSchedule} disabled={isScheduleSaved}>
          {isScheduleSaved ? <CheckCircle className="mr-2"/> : <Loader2 className="mr-2 animate-spin"/>}
          {isScheduleSaved ? 'Horario Guardado' : 'Guardar Cambios'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tempSchedule && daysOfWeek.map(day => (
          <div key={day} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{dayLabels[day]}</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor={`switch-${day}`}>Atiende</Label>
                <Switch 
                  id={`switch-${day}`} 
                  checked={tempSchedule[day].active} 
                  onCheckedChange={(checked) => handleScheduleChange(day, 'active', checked)} 
                />
              </div>
            </div>
            {tempSchedule[day].active && (
              <div className="space-y-2">
                {tempSchedule[day].slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input type="time" value={slot.start} onChange={(e) => handleScheduleChange(day, 'slot', {...slot, start: e.target.value}, index)} />
                    <Input type="time" value={slot.end} onChange={(e) => handleScheduleChange(day, 'slot', {...slot, end: e.target.value}, index)} />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(day, index)}>
                      <X className="h-4 w-4"/>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => handleAddSlot(day)}>+ Añadir bloque</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
