
"use client";

import { HeaderWrapper, BottomNav } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Search, UserCheck, CalendarDays, Bot } from "lucide-react";
import React, { useState, useEffect } from "react";
import * as firestoreService from "@/lib/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await firestoreService.getSettings();
        setHeroImageUrl(settings?.heroImageUrl || "https://placehold.co/1200x600.png");
      } catch (error) {
        console.error("Failed to fetch settings, possibly offline. Using defaults.", error);
        setHeroImageUrl("https://placehold.co/1200x600.png");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="container text-center py-10 md:py-32">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold font-headline tracking-tighter">
              Sistema Unificado de Medicina Avanzada
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 sm:mt-6">
              Encuentra, reserva y gestiona tus citas médicas en un solo lugar.
              Cuidar tu salud nunca fue tan fácil.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/find-a-doctor">Busca tu Médico</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Portal del Paciente</Link>
              </Button>
               <Button size="lg" variant="outline" asChild>
                <Link href="/auth/register-doctor">Registrarse como Médico</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container pb-20 md:pb-32">
           <div className="relative rounded-xl shadow-2xl overflow-hidden">
             {isLoading ? (
               <Skeleton className="w-full aspect-[2/1] rounded-xl" />
             ) : (
                <Image
                    src={heroImageUrl!}
                    alt="Paciente feliz en consulta con un doctor"
                    width={1200}
                    height={600}
                    className="w-full h-auto object-cover"
                    data-ai-hint="doctor patient"
                />
             )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 -mt-16 sm:-mt-24 relative z-10 px-2 sm:px-4">
              <FeatureCard
                icon={<Search />}
                title="Búsqueda Inteligente"
                description="Encuentra al especialista ideal por ubicación y especialidad."
              />
              <FeatureCard
                icon={<CalendarDays />}
                title="Reservas en Tiempo Real"
                description="Agenda citas al instante con disponibilidad actualizada."
              />
              <FeatureCard
                icon={<UserCheck />}
                title="Perfil Unificado"
                description="Gestiona tu historial y citas desde tu panel personal."
              />
              <FeatureCard
                icon={<Bot />}
                title="Asistente con IA"
                description="Obtén orientación y recomendaciones de nuestro asistente."
              />
            </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl shadow-lg text-center flex flex-col items-center border">
      <div className="mb-3 sm:mb-4 inline-block bg-primary/10 p-3 sm:p-4 rounded-full">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-7 w-7 sm:h-8 sm:w-8 text-primary",
        })}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl font-bold font-headline mb-1 sm:mb-2">{title}</h3>
      <p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
    </div>
  );
}
