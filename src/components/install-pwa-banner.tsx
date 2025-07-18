"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

// Definir tipo para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    if (isInstalled) {
      return; // No mostrar banner si ya está instalado
    }

    const handler = (event: unknown) => {
      if (
        event &&
        typeof event === 'object' &&
        'preventDefault' in event &&
        typeof (event as { preventDefault?: unknown }).preventDefault === 'function'
      ) {
        (event as BeforeInstallPromptEvent).preventDefault();
        setDeferredPrompt(event as BeforeInstallPromptEvent);
      }
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // También mostrar banner si no hay prompt pero es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !isInstalled) {
      setShowBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
        }
      } catch (error) {
        console.error('Error al instalar la app:', error);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Si no hay prompt nativo, mostrar instrucciones
      alert('Para instalar la app:\n\nEn Android: Toca el menú (⋮) y selecciona "Agregar a pantalla de inicio"\n\nEn iOS: Toca el botón compartir (□↑) y selecciona "Agregar a pantalla de inicio"');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // No mostrar si fue descartado en esta sesión
  useEffect(() => {
    if (localStorage.getItem('pwa-banner-dismissed') === 'true') {
      setShowBanner(false);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-50 max-w-sm">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Instalar SUMA</p>
          <p className="text-xs text-gray-600">Accede más rápido desde la APP.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="text-xs"
        >
          {isInstalling ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              Instalando...
            </>
          ) : (
            <>
              <Download className="w-3 h-3 mr-1" />
              Instalar
            </>
          )}
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 