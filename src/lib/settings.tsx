
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import * as firestoreService from './firestoreService';
import type { AppSettings, Coupon, CompanyExpense, BankDetail, City } from './types';
import { useToast } from '@/hooks/use-toast';

interface SettingsContextType {
  settings: AppSettings | null;
  cities: City[];
  specialties: string[];
  beautySpecialties: string[];
  timezone: string;
  logoUrl: string;
  heroImageUrl: string;
  currency: string;
  companyBankDetails: BankDetail[];
  companyExpenses: CompanyExpense[];
  coupons: Coupon[];
  billingCycleStartDay: number;
  billingCycleEndDay: number;

  updateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
  
  addListItem: (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', item: City | string | Omit<BankDetail, 'id'> | Omit<CompanyExpense, 'id'> | Omit<Coupon, 'id'>) => Promise<void>;
  updateListItem: (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemId: string, newItem: City | string | BankDetail | CompanyExpense | Coupon) => Promise<void>;
  deleteListItem: (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemToDeleteIdOrName: string) => Promise<void>;
}

const skeletonContextValue: SettingsContextType = {
  settings: null,
  cities: [],
  specialties: [],
  beautySpecialties: [],
  timezone: '',
  logoUrl: '',
  heroImageUrl: '',
  currency: 'USD',
  companyBankDetails: [],
  companyExpenses: [],
  coupons: [],
  billingCycleStartDay: 1,
  billingCycleEndDay: 6,
  updateSetting: async () => {},
  addListItem: async () => {},
  updateListItem: async () => {},
  deleteListItem: async () => {},
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        let settingsData = await firestoreService.getSettings();

        if (settingsData && (!settingsData.coupons || !settingsData.companyExpenses || !settingsData.companyBankDetails)) {
            const settingsUpdate: Partial<AppSettings> = {};
            let needsMigration = false;
            
            // This is a backward compatibility check. If we find collections that should be inside the settings doc, we migrate them.
            if (!settingsData.coupons) {
                const legacyCoupons = await firestoreService.getCollectionData<Coupon>('coupons');
                if (legacyCoupons.length > 0) {
                    settingsUpdate.coupons = legacyCoupons;
                    needsMigration = true;
                }
            }
            if (!settingsData.companyExpenses) {
                const legacyExpenses = await firestoreService.getCollectionData<CompanyExpense>('companyExpenses');
                if (legacyExpenses.length > 0) {
                    settingsUpdate.companyExpenses = legacyExpenses;
                    needsMigration = true;
                }
            }
            if (!settingsData.companyBankDetails) {
                 const legacyBankDetails = await firestoreService.getCollectionData<BankDetail>('companyBankDetails');
                 if (legacyBankDetails.length > 0) {
                    settingsUpdate.companyBankDetails = legacyBankDetails;
                    needsMigration = true;
                 }
            }

            if (needsMigration) {
                console.log("Migrating legacy settings data into the main settings document...");
                await firestoreService.updateSettings(settingsUpdate); 
                settingsData = await firestoreService.getSettings(); // Re-fetch to get merged data
                toast({ title: "Configuración Migrada", description: "Se han actualizado los datos de configuración a la nueva versión." });
            }
        }

        setSettings(settingsData);
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({ variant: 'destructive', title: "Error de Carga", description: "No se pudo cargar la configuración."});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    await firestoreService.updateSettings({ [key]: value });
    setSettings(newSettings);
  }, [settings]);
  
  const addListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', item: any) => {
    if (!settings) return;
    
    const list = (settings[listName] as any[]) || [];
    
    // Check for duplicates
    if (listName === 'cities' && list.some(c => c && c.name && c.name.toLowerCase() === item.name.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `La ciudad "${item.name}" ya existe.` });
        return;
    }
    if (listName === 'specialties' && list.map(i => i.toLowerCase()).includes(item.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `"${item}" ya existe en la lista.` });
        return;
    }
    if (listName === 'coupons' && list.some(c => c && c.code && c.code.toUpperCase() === item.code.toUpperCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `El cupón "${item.code}" ya existe.` });
        return;
    }

    const newItem = (listName === 'companyExpenses' || listName === 'companyBankDetails' || listName === 'coupons')
      ? { ...item, id: `${listName}-${Date.now()}` }
      : item;

    const newList = [...list, newItem];
    await updateSetting(listName, newList);
  }, [settings, updateSetting, toast]);

  const updateListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemIdOrName: string, newItem: any) => {
    if (!settings) return;

    const list = (settings[listName] as any[]) || [];
    let newList;
    
    if (listName === 'cities') {
        newList = list.map(item => (item && item.name === itemIdOrName) ? newItem : item);
    } else if (listName === 'specialties') {
        newList = list.map(item => item === itemIdOrName ? newItem : item);
    } else { // bank, expense, coupon
        newList = list.map(item => (item && item.id === itemIdOrName) ? { ...item, ...newItem } : item);
    }

    await updateSetting(listName, newList);
  }, [settings, updateSetting]);

  const deleteListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemToDeleteIdOrName: string) => {
    if (!settings) return;

    const list = (settings[listName] as any[]) || [];
    let newList;
    
    if (listName === 'cities') {
        newList = list.filter(item => item && item.name !== itemToDeleteIdOrName);
    } else if (listName === 'specialties') {
        newList = list.filter(item => item !== itemToDeleteIdOrName);
    } else { // bank, expense, coupon
        newList = list.filter(item => item && item.id !== itemToDeleteIdOrName);
    }

    await updateSetting(listName, newList);
  }, [settings, updateSetting]);


  const value: SettingsContextType = {
    settings,
    cities: settings?.cities || [],
    specialties: settings?.specialties || [],
    beautySpecialties: settings?.beautySpecialties || [],
    timezone: settings?.timezone || '',
    logoUrl: settings?.logoUrl || '',
    heroImageUrl: settings?.heroImageUrl || '',
    currency: settings?.currency || 'USD',
    companyBankDetails: settings?.companyBankDetails || [],
    companyExpenses: settings?.companyExpenses || [],
    coupons: settings?.coupons || [],
    billingCycleStartDay: settings?.billingCycleStartDay ?? 1,
    billingCycleEndDay: settings?.billingCycleEndDay ?? 6,
    updateSetting,
    addListItem,
    updateListItem,
    deleteListItem,
  };

  if (isLoading) {
    return (
      <SettingsContext.Provider value={skeletonContextValue}>
        {children}
      </SettingsContext.Provider>
    );
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
