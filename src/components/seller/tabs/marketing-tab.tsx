
"use client";

import { useState } from 'react';
import type { MarketingMaterial } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from 'next/image';
import { Copy, Download, Link as LinkIcon, Image as ImageIcon, Video, FileText, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

function MarketingMaterialCard({ material, onView }: { material: MarketingMaterial, onView: (m: MarketingMaterial) => void }) {
    const { toast } = useToast();
    const hasValidUrl = material.url && material.url.trim() !== '' && material.url !== '#';
    
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasValidUrl) {
        toast({ 
          variant: "destructive",
          title: "No hay enlace disponible", 
          description: "Este material no tiene un enlace para copiar." 
        });
        return;
      }
      navigator.clipboard.writeText(material.url);
      toast({ 
        title: "Enlace copiado", 
        description: "El enlace se ha copiado al portapapeles." 
      });
    };

    const getTypeIcon = (type: string) => {
      switch(type) {
        case 'image': return <ImageIcon className="h-4 w-4 text-blue-500" />;
        case 'video': return <Video className="h-4 w-4 text-purple-500" />;
        case 'file': return <FileText className="h-4 w-4 text-green-500" />;
        case 'url': return <LinkIcon className="h-4 w-4 text-orange-500" />;
        default: return <FileText className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
        <Card className="flex flex-col h-full cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-0 flex-grow" onClick={() => onView(material)}>
                <div className="aspect-video relative overflow-hidden">
                    <Image 
                      src={material.thumbnailUrl} 
                      alt={material.title} 
                      fill 
                      className="object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-200" 
                      data-ai-hint="marketing material" 
                    />
                    <div className="absolute top-2 left-2">
                      {getTypeIcon(material.type)}
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {material.type}
                      </Badge>
                      {!hasValidUrl && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin recurso
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-semibold line-clamp-2">{material.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-3 leading-relaxed">{material.description}</CardDescription>
                </div>
            </CardContent>
            {hasValidUrl && (
              <CardFooter className="flex gap-2 p-4 pt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 text-xs" 
                        onClick={handleCopy}
                      >
                        <Copy className="mr-1 h-3 w-3" /> 
                        Copiar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copiar enlace al portapapeles</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="flex-1 text-xs" 
                        size="sm"
                        asChild
                      >
                        <a href={material.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-3 w-3" /> 
                          Descargar
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Descargar recurso</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            )}
        </Card>
    )
}

interface MarketingTabProps {
  marketingMaterials: MarketingMaterial[];
}

export function MarketingTab({ marketingMaterials }: MarketingTabProps) {
  const { toast } = useToast();
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | null>(null);

  // Filtrar solo materiales con URLs válidas
  const validMaterials = marketingMaterials.filter(material => 
    material.url && material.url.trim() !== '' && material.url !== '#'
  );

  const handleViewMaterial = (material: MarketingMaterial) => {
    setSelectedMaterial(material);
    setIsMaterialDetailOpen(true);
  };

  const handleCopyFromDialog = () => {
    if (!selectedMaterial?.url || selectedMaterial.url.trim() === '' || selectedMaterial.url === '#') {
      toast({ 
        variant: "destructive",
        title: "No hay enlace disponible", 
        description: "Este material no tiene un enlace para copiar." 
      });
      return;
    }
    navigator.clipboard.writeText(selectedMaterial.url);
    toast({ 
      title: "Enlace copiado", 
      description: "El enlace se ha copiado al portapapeles." 
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'video': return <Video className="h-5 w-5 text-purple-500" />;
      case 'file': return <FileText className="h-5 w-5 text-green-500" />;
      case 'url': return <LinkIcon className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Material de Marketing</CardTitle>
              <CardDescription>
                Recursos proporcionados por SUMA para ayudarte a promocionar la plataforma.
                {marketingMaterials.length !== validMaterials.length && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    Mostrando {validMaterials.length} de {marketingMaterials.length} materiales disponibles
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {validMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validMaterials.map(material => (
                <MarketingMaterialCard key={material.id} material={material} onView={handleViewMaterial} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No hay materiales disponibles</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {marketingMaterials.length > 0 
                  ? "Los materiales disponibles aparecerán aquí cuando tengan recursos asociados"
                  : "Los materiales aparecerán aquí cuando estén disponibles"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isMaterialDetailOpen} onOpenChange={setIsMaterialDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedMaterial && getTypeIcon(selectedMaterial.type)}
              <div>
                <DialogTitle className="text-lg">{selectedMaterial?.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <DialogDescription className="capitalize">
                    {selectedMaterial?.type}
                  </DialogDescription>
                  {selectedMaterial?.url && selectedMaterial.url.trim() !== '' && selectedMaterial.url !== '#' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Recurso disponible
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          {selectedMaterial && (
            <div className="py-4 space-y-6">
              {(selectedMaterial.type === 'image' || selectedMaterial.type === 'video') && selectedMaterial.url && selectedMaterial.url !== '#' && (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                  {selectedMaterial.type === 'image' && (
                    <Image 
                      src={selectedMaterial.url} 
                      alt={selectedMaterial.title} 
                      fill 
                      className="object-contain" 
                    />
                  )}
                  {selectedMaterial.type === 'video' && (
                    <video 
                      src={selectedMaterial.url} 
                      controls 
                      className="w-full h-full" 
                    />
                  )}
                </div>
              )}
              
              {(!selectedMaterial.url || selectedMaterial.url.trim() === '' || selectedMaterial.url === '#') && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Sin recurso disponible</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este material no tiene un archivo o enlace asociado para descargar.
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Descripción Detallada
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMaterial.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={handleCopyFromDialog}
            >
              <Copy className="mr-2 h-4 w-4"/> 
              Copiar Enlace
            </Button>
            <Button 
              className="w-full sm:w-auto" 
              disabled={!selectedMaterial?.url || selectedMaterial.url.trim() === '' || selectedMaterial.url === '#'}
              asChild={selectedMaterial?.url && selectedMaterial.url.trim() !== '' && selectedMaterial.url !== '#' ? true : undefined}
            >
              {selectedMaterial?.url && selectedMaterial.url.trim() !== '' && selectedMaterial.url !== '#' ? (
                <a href={selectedMaterial.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4"/> 
                  Abrir Recurso
                </a>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4"/> 
                  Sin Recurso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
