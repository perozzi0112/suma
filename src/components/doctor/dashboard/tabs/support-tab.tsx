
"use client";

import type { AdminSupportTicket } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupportTabProps {
  supportTickets: AdminSupportTicket[];
  onOpenTicketDialog: () => void;
  onViewTicket: (ticket: AdminSupportTicket) => void;
}

export function SupportTab({ supportTickets, onOpenTicketDialog, onViewTicket }: SupportTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Soporte Técnico</CardTitle>
        <Button onClick={onOpenTicketDialog}>
          <PlusCircle className="mr-2"/>Abrir Ticket
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supportTickets.length > 0 ? supportTickets.map(ticket => (
              <TableRow key={ticket.id}>
                <TableCell>{format(parseISO(ticket.date), "dd MMM, yyyy", { locale: es })}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>
                  <Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewTicket(ticket)}>Ver</Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No tienes tickets de soporte.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
