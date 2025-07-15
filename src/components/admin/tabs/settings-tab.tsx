"use client";

import { useState } from 'react';
import { useSettings } from '@/lib/settings';
import type { City } from '@/lib/types';
import { GeneralSettingsCard } from './settings/general-settings-card';
import { ListManagementCard } from './settings/list-management-card';
import { CouponManagementCard } from './settings/coupon-management-card';
import { BankManagementCard } from './settings/bank-management-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  MapPin, 
  Stethoscope, 
  CreditCard, 
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

export function SettingsTab() {
  const { 
    settings, 
    updateSetting,
    cities,
    specialties,
    beautySpecialties,
    currency,
    timezone,
    billingCycleStartDay,
    billingCycleEndDay,
    coupons,
    companyBankDetails,
    addListItem,
    updateListItem,
    deleteListItem,
  } = useSettings();

  const [activeTab, setActiveTab] = useState("general");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Debug: Agregar console.log para ver qué está pasando
  console.log('SettingsTab render:', {
    settings: !!settings,
    cities: cities?.length,
    specialties: specialties?.length,
    beautySpecialties: beautySpecialties?.length,
    coupons: coupons?.length,
    companyBankDetails: companyBankDetails?.length
  });

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando configuración...</p>
          <p className="text-xs text-muted-foreground">Si esto no carga, verifica la consola del navegador</p>
        </div>
      </div>
    );
  }

  const handleAddBeautySpecialty = async (specialty: string) => {
    const currentSpecialties = beautySpecialties || [];
    const newSpecialties = [...currentSpecialties, specialty];
    await updateSetting('beautySpecialties', newSpecialties);
  };

  const handleRemoveBeautySpecialty = async (specialty: string) => {
    const currentSpecialties = beautySpecialties || [];
    const newSpecialties = currentSpecialties.filter(s => s !== specialty);
    await updateSetting('beautySpecialties', newSpecialties);
  };

  const tabConfig = [
    {
      value: "general",
      icon: Settings,
      label: "General",
      count: null
    },
    {
      value: "cities",
      icon: MapPin,
      label: "Ciudades",
      count: cities.length
    },
    {
      value: "specialties",
      icon: Stethoscope,
      label: "Especialidades",
      count: specialties.length
    },
    {
      value: "coupons",
      icon: CreditCard,
      label: "Cupones",
      count: coupons.length
    },
    {
      value: "banking",
      icon: Building2,
      label: "Bancario",
      count: companyBankDetails.length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header con estadísticas mejorado */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-primary" />
            Configuración del Sistema
          </CardTitle>
          <CardDescription className="text-base">
            Gestiona todos los ajustes y configuraciones de la plataforma SUMA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-primary">{cities.length}</div>
              <div className="text-xs text-muted-foreground">Ciudades</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-primary">{specialties.length}</div>
              <div className="text-xs text-muted-foreground">Especialidades</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-primary">{coupons.length}</div>
              <div className="text-xs text-muted-foreground">Cupones</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-primary">{companyBankDetails.length}</div>
              <div className="text-xs text-muted-foreground">Cuentas Bancarias</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border shadow-sm md:col-span-1 col-span-2">
              <div className="text-2xl font-bold text-primary">{beautySpecialties?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Especialidades de Belleza</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación móvil mejorada */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            {tabConfig.find(tab => tab.value === activeTab)?.label}
          </span>
          {showMobileMenu ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        
        {showMobileMenu && (
          <div className="mt-2 space-y-1">
            {tabConfig.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                onClick={() => {
                  setActiveTab(tab.value);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count !== null && (
                  <Badge variant="secondary" className="ml-auto">
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs de configuración mejorados */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* TabsList solo visible en desktop */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5 gap-2 h-12">
            {tabConfig.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6 mt-0">
          <GeneralSettingsCard 
            logoUrl={settings.logoUrl} 
            heroImageUrl={settings.heroImageUrl}
            currency={currency}
            timezone={timezone}
            beautySpecialties={beautySpecialties}
            allSpecialties={specialties}
            billingCycleStartDay={billingCycleStartDay}
            billingCycleEndDay={billingCycleEndDay}
            onSave={updateSetting}
            onAddBeautySpecialty={handleAddBeautySpecialty}
            onRemoveBeautySpecialty={handleRemoveBeautySpecialty}
          />
        </TabsContent>

        <TabsContent value="cities" className="space-y-6 mt-0">
          <ListManagementCard 
            title="Ciudades y Tarifas"
            description="Gestiona las ciudades donde opera SUMA y sus tarifas de suscripción."
            listName="cities"
            items={cities.map(c => ({ id: c.name, ...c }))}
            onAddItem={(item) => addListItem('cities', item as City)}
            onUpdateItem={(id, item) => updateListItem('cities', id, item as City)}
            onDeleteItem={(id) => deleteListItem('cities', id)}
            columns={[
                { header: 'Ciudad', key: 'name' },
                { header: 'Tarifa de Suscripción', key: 'subscriptionFee', isCurrency: true }
            ]}
            itemSchema={{
                name: { label: 'Nombre de la Ciudad', type: 'text' },
                subscriptionFee: { label: 'Tarifa Mensual ($)', type: 'number' }
            }}
            itemNameSingular="Ciudad"
          />
        </TabsContent>

        <TabsContent value="specialties" className="space-y-6 mt-0">
          <ListManagementCard 
            title="Especialidades Médicas"
            description="Gestiona las especialidades médicas disponibles en la plataforma."
            listName="specialties"
            items={specialties.map(s => ({ id: s, name: s }))}
            onAddItem={(item) => addListItem('specialties', (item as { name: string }).name)}
            onUpdateItem={(id, item) => updateListItem('specialties', id, (item as { name: string }).name)}
            onDeleteItem={(id) => deleteListItem('specialties', id)}
            columns={[ { header: 'Nombre', key: 'name' } ]}
            itemSchema={{ name: { label: 'Nombre de la Especialidad', type: 'text' } }}
            itemNameSingular="Especialidad"
          />
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6 mt-0">
          <CouponManagementCard 
            coupons={coupons}
            onAddCoupon={(coupon) => addListItem('coupons', coupon)}
            onUpdateCoupon={(id, coupon) => updateListItem('coupons', id, coupon)}
            onDeleteCoupon={(id) => deleteListItem('coupons', id)}
          />
        </TabsContent>

        <TabsContent value="banking" className="space-y-6 mt-0">
          <BankManagementCard
            bankDetails={companyBankDetails}
            onAddBankDetail={(detail) => addListItem('companyBankDetails', detail)}
            onUpdateBankDetail={(id, detail) => updateListItem('companyBankDetails', id, detail)}
            onDeleteBankDetail={(id) => deleteListItem('companyBankDetails', id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
