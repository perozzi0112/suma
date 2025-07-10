
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingMaterial } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

interface MarketingMaterialCardProps {
  material: MarketingMaterial;
  onEdit: () => void;
  onDelete: () => void;
}

export function MarketingMaterialCard({ material, onEdit, onDelete }: MarketingMaterialCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
            <Image 
                src={material.thumbnailUrl} 
                alt={material.title} 
                fill 
                className="object-cover rounded-t-lg"
                data-ai-hint="marketing material"
            />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2 flex-grow">
          <Badge variant="secondary" className="capitalize w-fit">{material.type}</Badge>
          <CardTitle className="text-lg">{material.title}</CardTitle>
          <CardDescription className="text-xs line-clamp-2">{material.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </Button>
        <Button variant="destructive" className="w-full" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
