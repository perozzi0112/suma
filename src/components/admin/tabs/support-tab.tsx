
"use client";
import { useState, useCallback, useEffect } from "react";
import type { AdminSupportTicket, ChatMessage } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { Mail, Briefcase, User, Send, Check, Loader2 } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export function SupportTab() {
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await firestoreService.getSupportTickets();
        setTickets(data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los tickets de soporte.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewTicket = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setIsDetailDialogOpen(true);
  };

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { sender: 'admin', text: replyMessage.trim() };
    await firestoreService.addMessageToSupportTicket(selectedTicket.id, newMessage);
    setReplyMessage("");
    fetchData(); // Re-fetch to get the updated ticket
    // Optimistically update dialog
    const updatedTicket = { ...selectedTicket, messages: [...(selectedTicket.messages || []), { ...newMessage, id: `temp-${Date.now()}`, timestamp: new Date().toISOString() }]};
    setSelectedTicket(updatedTicket);
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    await firestoreService.updateSupportTicket(selectedTicket.id, { status: 'cerrado' });
    setIsDetailDialogOpen(false);
    fetchData();
    toast({ title: 'Ticket Cerrado', description: `El ticket de ${selectedTicket.userName} ha sido cerrado.` });
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Soporte Técnico</CardTitle>
          <CardDescription>Gestiona las solicitudes de soporte de médicos y vendedoras.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {tickets.length > 0 ? tickets.map((ticket) => (
                <TableRow key={ticket.id} className={cn(!ticket.readByAdmin && "bg-blue-50 font-semibold")}>
                  <TableCell>{format(parseISO(ticket.date), 'dd MMM yyyy', { locale: es })}</TableCell>
                  <TableCell>{ticket.userName}</TableCell>
                  <TableCell className="capitalize">{ticket.userRole}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell><Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>{ticket.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}>Ver Ticket</Button></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center h-24">No hay tickets de soporte.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Ticket de Soporte: {selectedTicket?.subject}</DialogTitle>
            {selectedTicket && <DialogDescription className="flex items-center gap-4 pt-2">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {selectedTicket.userName}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4"/> {selectedTicket.userId}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/> <span className="capitalize">{selectedTicket.userRole}</span></span>
            </DialogDescription>}
          </DialogHeader>
          {selectedTicket && (
            <>
              <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-4">
                {(selectedTicket.messages || []).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'admin' && 'justify-end')}>
                        {msg.sender !== 'admin' && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold">{(selectedTicket.userName || 'U').charAt(0)}</div>}
                        <div className={cn("p-3 rounded-lg max-w-sm shadow-sm", msg.sender === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}</p>
                        </div>
                        {msg.sender === 'admin' && <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">A</div>}
                    </div>
                ))}
              </div>
              {selectedTicket.status === 'abierto' && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <Input placeholder="Escribe tu respuesta..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} />
                  <Button onClick={handleSendAdminReply} disabled={!replyMessage.trim()} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          )}
          <DialogFooter className="pt-4">
            <Button variant="secondary" onClick={() => setIsDetailDialogOpen(false)}>Cerrar Ventana</Button>
            {selectedTicket?.status === 'abierto' && <Button onClick={handleCloseTicket}><Check className="mr-2 h-4 w-4"/> Marcar como Resuelto</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
