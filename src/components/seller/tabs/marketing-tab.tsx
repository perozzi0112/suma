
"use client";

import { useState } from 'react';
import type { MarketingMaterial } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Copy, Download, Link as LinkIcon, Image as ImageIcon, Video, FileText } from 'lucide-react';

function MarketingMaterialCard({ material, onView }: { material: MarketingMaterial, onView: (m: MarketingMaterial) => void }) {
    const { toast } = useToast();
    
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(material.url);
      toast({ title: "Enlace copiado al portapapeles." });
    };

    return (
        <Card className="flex flex-col h-full cursor-pointer hover:border-primary transition-colors" onClick={() => onView(material)}>
            <CardContent className="p-0 flex-grow">
                <div className="aspect-video relative">
                    <Image src={material.thumbnailUrl} alt={material.title} fill className="object-cover rounded-t-lg" data-ai-hint="marketing material" />
                </div>
                <div className="p-4 space-y-2">
                    <Badge variant="secondary" className="capitalize w-fit">{material.type}</Badge>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{material.description}</CardDescription>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Enlace
                </Button>
                <Button className="w-full" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 h-4 w-4" /> Descargar
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}

interface MarketingTabProps {
  marketingMaterials: MarketingMaterial[];
}

export function MarketingTab({ marketingMaterials }: MarketingTabProps) {
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | null>(null);

  const handleViewMaterial = (material: MarketingMaterial) => {
    setSelectedMaterial(material);
    setIsMaterialDetailOpen(true);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Material de Marketing</CardTitle>
          <CardDescription>Recursos proporcionados por SUMA para ayudarte a promocionar la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          {marketingMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketingMaterials.map(material => (
                <MarketingMaterialCard key={material.id} material={material} onView={handleViewMaterial} />
              ))}
            </div>
          ) : (<p className="text-center text-muted-foreground py-12">No hay materiales de marketing disponibles en este momento.</p>)}
        </CardContent>
      </Card>
      
      <Dialog open={isMaterialDetailOpen} onOpenChange={setIsMaterialDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title}</DialogTitle>
            <DialogDescription className="capitalize flex items-center gap-2">
              {selectedMaterial?.type === 'image' && <ImageIcon className="h-4 w-4"/>}
              {selectedMaterial?.type === 'video' && <Video className="h-4 w-4"/>}
              {selectedMaterial?.type === 'file' && <FileText className="h-4 w-4"/>}
              {selectedMaterial?.type === 'url' && <LinkIcon className="h-4 w-4"/>}
              {selectedMaterial?.type}
            </DialogDescription>
          </DialogHeader>
          {selectedMaterial && (
            <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              {(selectedMaterial.type === 'image' || selectedMaterial.type === 'video') &&
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                  {selectedMaterial.type === 'image' && <Image src={selectedMaterial.url} alt={selectedMaterial.title} layout="fill" className="object-contain" />}
                  {selectedMaterial.type === 'video' && <video src={selectedMaterial.url} controls className="w-full h-full" />}
                </div>
              }
              <div>
                <h4 className="font-semibold mb-1">Descripción Detallada</h4>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedMaterial.description}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="w-full" onClick={() => {
              if (!selectedMaterial) return;
              navigator.clipboard.writeText(selectedMaterial.url);
              // You might need to import useToast at the top of this component
              // toast({ title: "Enlace copiado al portapapeles." });
            }}>
              <Copy className="mr-2"/> Copiar Enlace
            </Button>
            <Button className="w-full" asChild>
              <a href={selectedMaterial?.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2"/> Descargar
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
