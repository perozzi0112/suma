
"use client";

import { useState } from 'react';
import type { AdminSupportTicket, Seller, ChatMessage } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { PlusCircle, MessageSquarePlus, Loader2, Send, Eye } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const SupportTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

interface SupportTabProps {
  supportTickets: AdminSupportTicket[];
  sellerData: Seller;
  onUpdate: () => void;
}

export function SupportTab({ supportTickets, sellerData, onUpdate }: SupportTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isSupportDetailDialogOpen, setIsSupportDetailDialogOpen] = useState(false);
  const [selectedSupportTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || user.role !== 'seller') return;
    setIsSubmittingTicket(true);

    const formData = new FormData(e.currentTarget);
    const dataToValidate = {
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
    };

    const result = SupportTicketSchema.safeParse(dataToValidate);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error de Validación', description: result.error.errors.map(err => err.message).join(' ') });
      setIsSubmittingTicket(false);
      return;
    }

    const newTicket: Omit<AdminSupportTicket, 'id' | 'messages'> = {
        userId: user.email, userName: user.name, userRole: 'seller', status: 'abierto',
        date: new Date().toISOString().split('T')[0], subject: result.data.subject, description: result.data.description,
    };
    
    try {
      await firestoreService.addSupportTicket(newTicket);
      onUpdate();
      setIsSupportDialogOpen(false);
      (e.target as HTMLFormElement).reset();
      toast({ title: "Ticket Enviado", description: "Tu solicitud ha sido enviada al equipo de soporte de SUMA." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "No se pudo enviar el ticket."});
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleViewTicket = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setIsSupportDetailDialogOpen(true);
  };

  const handleSendSellerReply = async () => {
    if (!selectedSupportTicket || !replyMessage.trim() || !user) return;

    const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { sender: 'user', text: replyMessage.trim() };
    await firestoreService.addMessageToSupportTicket(selectedSupportTicket.id, newMessage);
    setReplyMessage("");
    onUpdate();
    // Optimistically update dialog
    const updatedTicket = { ...selectedSupportTicket, messages: [...(selectedSupportTicket.messages || []), { ...newMessage, id: `temp-${Date.now()}`, timestamp: new Date().toISOString() }]};
    setSelectedTicket(updatedTicket);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Soporte Técnico</CardTitle>
              <CardDescription>Gestiona tus tickets de soporte con el equipo de SUMA.</CardDescription>
            </div>
            <Button onClick={() => setIsSupportDialogOpen(true)}><MessageSquarePlus className="mr-2 h-4 w-4"/> Crear Nuevo Ticket</Button>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
              {(supportTickets || []).map(ticket => (
                  <TableRow key={ticket.id}>
                      <TableCell>{format(new Date(ticket.date + 'T00:00:00'), "d 'de' LLLL, yyyy", { locale: es })}</TableCell>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell><Badge className={cn(ticket.status === 'abierto' ? 'bg-blue-600' : 'bg-gray-500', 'text-white capitalize')}>{ticket.status}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}><Eye className="mr-2 h-4 w-4" /> Ver</Button></TableCell>
                  </TableRow>
              ))}
               {(supportTickets || []).length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">No tienes tickets de soporte.</TableCell></TableRow>)}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir un Ticket de Soporte</DialogTitle><DialogDescription>Describe tu problema y el equipo de SUMA se pondrá en contacto contigo.</DialogDescription></DialogHeader>
          <form onSubmit={handleCreateTicket}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subject" className="text-right">Asunto</Label><Input id="subject" name="subject" placeholder="ej., Problema con un referido" className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descripción</Label><Textarea id="description" name="description" placeholder="Detalla tu inconveniente aquí..." className="col-span-3" rows={5} required /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmittingTicket}>
                {isSubmittingTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSupportDetailDialogOpen} onOpenChange={setIsSupportDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Ticket de Soporte: {selectedSupportTicket?.subject}</DialogTitle></DialogHeader>
          {selectedSupportTicket && (
            <>
              <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-4">
                {(selectedSupportTicket.messages || []).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'user' && 'justify-end')}>
                        {msg.sender === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>}
                        <div className={cn("p-3 rounded-lg max-w-xs shadow-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}</p>
                        </div>
                        {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarImage src={sellerData?.profileImage} /><AvatarFallback>{(selectedSupportTicket.userName || 'U').charAt(0)}</AvatarFallback></Avatar>}
                    </div>
                ))}
              </div>
              {selectedSupportTicket.status === 'abierto' && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <Textarea placeholder="Escribe tu respuesta..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={2} />
                  <Button onClick={handleSendSellerReply} disabled={!replyMessage.trim()} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              )}
              <DialogFooter className="pt-4"><Button variant="outline" onClick={() => setIsSupportDetailDialogOpen(false)}>Cerrar Ventana</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
