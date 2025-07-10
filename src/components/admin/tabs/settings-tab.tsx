"use client";

import { useSettings } from '@/lib/settings';
import { GeneralSettingsCard } from './settings/general-settings-card';
import { ListManagementCard } from './settings/list-management-card';
import { CouponManagementCard } from './settings/coupon-management-card';
import { BankManagementCard } from './settings/bank-management-card';

export function SettingsTab() {
  const { 
    settings, 
    updateSetting,
    cities,
    specialties,
    coupons,
    companyBankDetails,
    addListItem,
    updateListItem,
    deleteListItem,
  } = useSettings();

  if (!settings) {
    return <div>Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <GeneralSettingsCard 
        logoUrl={settings.logoUrl} 
        heroImageUrl={settings.heroImageUrl} 
        onSave={updateSetting} 
      />
      <ListManagementCard 
        title="Ciudades y Tarifas"
        description="Gestiona las ciudades donde opera SUMA y sus tarifas de suscripción."
        listName="cities"
        items={cities.map(c => ({ id: c.name, ...c }))}
        onAddItem={(item) => addListItem('cities', item)}
        onUpdateItem={(id, item) => updateListItem('cities', id, item)}
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
       <ListManagementCard 
        title="Especialidades Médicas"
        description="Gestiona las especialidades médicas disponibles en la plataforma."
        listName="specialties"
        items={specialties.map(s => ({ id: s, name: s }))}
        onAddItem={(item) => addListItem('specialties', item.name)}
        onUpdateItem={(id, item) => updateListItem('specialties', id, item.name)}
        onDeleteItem={(id) => deleteListItem('specialties', id)}
        columns={[ { header: 'Nombre', key: 'name' } ]}
        itemSchema={{ name: { label: 'Nombre de la Especialidad', type: 'text' } }}
        itemNameSingular="Especialidad"
      />
      <CouponManagementCard 
        coupons={coupons}
        onAddCoupon={(coupon) => addListItem('coupons', coupon)}
        onUpdateCoupon={(id, coupon) => updateListItem('coupons', id, coupon)}
        onDeleteCoupon={(id) => deleteListItem('coupons', id)}
      />
      <BankManagementCard
        bankDetails={companyBankDetails}
        onAddBankDetail={(detail) => addListItem('companyBankDetails', detail)}
        onUpdateBankDetail={(id, detail) => updateListItem('companyBankDetails', id, detail)}
        onDeleteBankDetail={(id) => deleteListItem('companyBankDetails', id)}
      />
    </div>
  );
}
