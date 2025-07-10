
"use client";

import { useMemo } from 'react';
import type { Doctor, DoctorPayment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Shield, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionTabProps {
  doctorData: Doctor;
  doctorPayments: DoctorPayment[];
  onOpenPaymentDialog: () => void;
  subscriptionFee: number;
}

export function SubscriptionTab({ doctorData, doctorPayments, onOpenPaymentDialog, subscriptionFee }: SubscriptionTabProps) {
  const sortedPayments = useMemo(() => {
    return [...doctorPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [doctorPayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield /> Mi Suscripción</CardTitle>
        <CardDescription>Gestiona tu membresía en SUMA para seguir recibiendo pacientes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-1">
            <p className="text-sm text-muted-foreground">Estado Actual</p>
            <Badge className={cn('capitalize text-base px-3 py-1', {'bg-green-600 text-white': doctorData.subscriptionStatus === 'active', 'bg-amber-500 text-white': doctorData.subscriptionStatus === 'pending_payment','bg-red-600 text-white': doctorData.subscriptionStatus === 'inactive'})}>
              {doctorData.subscriptionStatus === 'active' ? 'Activa' : doctorData.subscriptionStatus === 'pending_payment' ? 'Pago en Revisión' : 'Inactiva'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Monto de Suscripción</p>
            <p className="text-2xl font-bold">${subscriptionFee.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/mes</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Último Pago</p>
            <p className="font-semibold">{doctorData.lastPaymentDate ? format(new Date(doctorData.lastPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Próximo Vencimiento</p>
            <p className="font-semibold">{doctorData.nextPaymentDate ? format(new Date(doctorData.nextPaymentDate + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es }) : 'N/A'}</p>
          </div>
        </div>
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Reportar un Pago</CardTitle>
            <CardDescription>¿Ya realizaste el pago de tu suscripción? Repórtalo aquí para que el equipo de SUMA lo verifique.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onOpenPaymentDialog} disabled={doctorData.subscriptionStatus === 'pending_payment'}>
              <Upload className="mr-2 h-4 w-4" /> Reportar Pago
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>ID Transacción</TableHead>
                  <TableHead className="text-right">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.length > 0 ? (
                  sortedPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.date + 'T00:00:00'), "d MMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>${p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={cn({'bg-green-600 text-white': p.status === 'Paid', 'bg-amber-500 text-white': p.status === 'Pending', 'bg-red-600 text-white': p.status === 'Rejected'})}>
                          {p.status === 'Paid' ? 'Pagado' : p.status === 'Pending' ? 'En Revisión' : 'Rechazado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.transactionId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a href={p.paymentProofUrl || '#'} target="_blank" rel="noopener noreferrer" >Ver</a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay pagos registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
