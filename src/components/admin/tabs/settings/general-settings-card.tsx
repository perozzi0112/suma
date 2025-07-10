"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface GeneralSettingsCardProps {
  logoUrl?: string;
  heroImageUrl?: string;
  onSave: (key: 'logoUrl' | 'heroImageUrl', value: string) => Promise<void>;
}

export function GeneralSettingsCard({ logoUrl, heroImageUrl, onSave }: GeneralSettingsCardProps) {
    const { toast } = useToast();

    const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newLogoUrl = formData.get('logoUrl') as string;
        const newHeroImageUrl = formData.get('heroImageUrl') as string;

        try {
            if (newLogoUrl !== logoUrl) {
                await onSave('logoUrl', newLogoUrl);
            }
            if (newHeroImageUrl !== heroImageUrl) {
                await onSave('heroImageUrl', newHeroImageUrl);
            }
            toast({ title: 'Configuración Guardada', description: 'Los ajustes generales han sido actualizados.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
        }
    };
    
  return (
    <Card>
      <form onSubmit={handleSaveGeneral}>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>Ajustes globales de la plataforma, como el logo y la imagen principal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logoUrl">URL del Logo</Label>
            <Input id="logoUrl" name="logoUrl" defaultValue={logoUrl} />
          </div>
          <div>
            <Label htmlFor="heroImageUrl">URL de la Imagen Principal (Hero)</Label>
            <Input id="heroImageUrl" name="heroImageUrl" defaultValue={heroImageUrl} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit"><Save className="mr-2 h-4 w-4"/>Guardar Cambios</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
