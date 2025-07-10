"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

type Item = {
    id: string;
    [key: string]: any;
};

interface ColumnDefinition {
    header: string;
    key: string;
    isCurrency?: boolean;
}

interface ItemSchema {
    [key: string]: {
        label: string;
        type: 'text' | 'number';
    }
}

interface ListManagementCardProps {
    title: string;
    description: string;
    listName: string;
    items: Item[];
    onAddItem: (item: any) => Promise<void>;
    onUpdateItem: (id: string, item: any) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    columns: ColumnDefinition[];
    itemSchema: ItemSchema;
    itemNameSingular: string;
}

export function ListManagementCard({ title, description, items, onAddItem, onUpdateItem, onDeleteItem, columns, itemSchema, itemNameSingular }: ListManagementCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const openDialog = (item: Item | null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: Item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItemData: { [key: string]: any } = {};
    
    for (const key in itemSchema) {
        const value = formData.get(key) as string;
        newItemData[key] = itemSchema[key].type === 'number' ? Number(value) : value;
    }

    try {
        if (editingItem) {
            await onUpdateItem(editingItem.id, newItemData);
            toast({ title: `${itemNameSingular} actualizado(a)` });
        } else {
            await onAddItem(newItemData);
            toast({ title: `${itemNameSingular} añadido(a)` });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo guardar el/la ${itemNameSingular.toLowerCase()}.` });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
        await onDeleteItem(itemToDelete.id);
        toast({ title: `${itemNameSingular} eliminado(a)` });
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar el/la ${itemNameSingular.toLowerCase()}.` });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={() => openDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4"/>Añadir {itemNameSingular}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
                {columns.map(col => <TableHead key={col.key} className={col.isCurrency ? 'text-right' : ''}>{col.header}</TableHead>)}
                <TableHead className="w-24 text-center">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                    {columns.map(col => (
                        <TableCell key={col.key} className={col.isCurrency ? 'text-right' : ''}>
                           {col.isCurrency ? `$${Number(item[col.key]).toFixed(2)}` : item[col.key]}
                        </TableCell>
                    ))}
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openDialog(item)}><Pencil className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(item)}><Trash2 className="h-4 w-4"/></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center">No hay elementos.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? `Editar ${itemNameSingular}` : `Nueva ${itemNameSingular}`}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            {Object.entries(itemSchema).map(([key, schema]) => (
                 <div key={key}>
                    <Label htmlFor={key}>{schema.label}</Label>
                    <Input 
                        id={key} 
                        name={key} 
                        type={schema.type} 
                        defaultValue={editingItem ? editingItem[key] : ''} 
                        required
                    />
                </div>
            ))}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente. ¿Seguro que quieres eliminar este elemento?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({variant: 'destructive'}))}>
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
