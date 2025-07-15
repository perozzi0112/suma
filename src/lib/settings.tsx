
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import * as firestoreService from './firestoreService';
import type { AppSettings, Coupon, CompanyExpense, BankDetail, City } from './types';
import { useToast } from '@/hooks/use-toast';
import { getCurrentDateTimeInVenezuela } from './utils';
import { Timestamp } from 'firebase/firestore';

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

  updateSetting: (key: keyof AppSettings, value: unknown) => Promise<void>;
  
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
        console.log('🔍 Fetching settings...');
        let settingsData = await firestoreService.getSettings();
        console.log('📋 Settings data received:', settingsData);

        // Si no existe configuración, crear configuración por defecto
        if (!settingsData) {
            console.log('❌ No settings found, creating default settings...');
            const defaultSettings = {
                cities: [
                    { name: 'Caracas', subscriptionFee: 50 },
                    { name: 'Valencia', subscriptionFee: 45 },
                    { name: 'Maracaibo', subscriptionFee: 40 }
                ],
                specialties: [
                    'Cardiología',
                    'Dermatología',
                    'Ginecología',
                    'Ortopedia',
                    'Pediatría',
                    'Psicología'
                ],
                beautySpecialties: [
                    'Dermatología',
                    'Cirugía Plástica'
                ],
                coupons: [
                    {
                        id: 'welcome-2024',
                        code: 'WELCOME2024',
                        description: 'Cupón de bienvenida',
                        discountType: 'percentage' as const,
                        discountValue: 20,
                        validFrom: Timestamp.fromDate(new Date(getCurrentDateTimeInVenezuela().toISOString().split('T')[0])),
                        validTo: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 año
                        isActive: true,
                        createdAt: Timestamp.fromDate(getCurrentDateTimeInVenezuela()),
                        updatedAt: Timestamp.fromDate(getCurrentDateTimeInVenezuela()),
                        scopeType: 'all' as const
                    }
                ],
                companyBankDetails: [],
                companyExpenses: [],
                currency: 'USD',
                timezone: 'America/Caracas',
                logoUrl: '',
                heroImageUrl: '',
                billingCycleStartDay: 1,
                billingCycleEndDay: 6
            };
            
            await firestoreService.updateSettings(defaultSettings);
            settingsData = await firestoreService.getSettings();
            console.log('✅ Default settings created:', settingsData);
            toast({ title: "Configuración Creada", description: "Se ha creado la configuración inicial del sistema." });
        }

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

        console.log('✅ Final settings data:', settingsData);
        setSettings(settingsData);
    } catch (error) {
        console.error("❌ Failed to fetch settings:", error);
        toast({ variant: 'destructive', title: "Error de Carga", description: "No se pudo cargar la configuración."});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: unknown) => {
    if (!settings) return;
    
    // Filtrar campos undefined del valor antes de enviar a Firestore
    const cleanValue = value;
    if (typeof cleanValue === 'object' && cleanValue !== null) {
      Object.keys(cleanValue).forEach(k => {
        if ((cleanValue as Record<string, unknown>)[k] === undefined) {
          delete (cleanValue as Record<string, unknown>)[k];
        }
      });
    }
    
    const newSettings = { ...settings, [key]: cleanValue };
    await firestoreService.updateSettings({ [key]: cleanValue });
    setSettings(newSettings);
  }, [settings]);
  
  const addListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', item: City | string | Omit<BankDetail, 'id'> | Omit<CompanyExpense, 'id'> | Omit<Coupon, 'id'>) => {
    if (!settings) return;
    
    const list = (settings[listName] as unknown[]) || [];
    
    // Check for duplicates
    if (listName === 'cities' && typeof item === 'object' && 'name' in item && list.some(c => typeof c === 'object' && c !== null && 'name' in c && typeof ((c as Record<string, unknown>).name) === 'string' && ((c as Record<string, unknown>).name as string).toLowerCase() === (item as City).name.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `La ciudad "${(item as City).name}" ya existe.` });
        return;
    }
    if (listName === 'specialties' && typeof item === 'string' && list.map(i => typeof i === 'string' ? (i as string).toLowerCase() : '').includes(item.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `"${item}" ya existe en la lista.` });
        return;
    }
    if (listName === 'coupons' && typeof item === 'object' && 'code' in item && list.some(c => typeof c === 'object' && c !== null && 'code' in c && typeof ((c as Record<string, unknown>).code) === 'string' && ((c as Record<string, unknown>).code as string).toUpperCase() === (item as Omit<Coupon, 'id'>).code.toUpperCase())) {
        toast({ variant: 'destructive', title: 'Elemento duplicado', description: `El cupón "${(item as Omit<Coupon, 'id'>).code}" ya existe.` });
        return;
    }

    let newItem;
    if (listName === 'companyExpenses' || listName === 'companyBankDetails' || listName === 'coupons') {
        // Limpiar campos undefined del item antes de crear el nuevo elemento
        if (typeof item === 'object') {
            const cleanItem = { ...item } as Record<string, unknown>;
            Object.keys(cleanItem).forEach(k => {
                if (cleanItem[k] === undefined) {
                    delete cleanItem[k];
                }
            });
            newItem = { ...cleanItem, id: `${listName}-${Date.now()}` };
        } else {
            newItem = item;
        }
    } else {
        newItem = item;
    }

    const newList = [...list, newItem];
    await updateSetting(listName, newList);
  }, [settings, updateSetting, toast]);

  const updateListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemIdOrName: string, newItem: City | string | BankDetail | CompanyExpense | Coupon) => {
    if (!settings) return;

    const list = (settings[listName] as unknown[]) || [];
    let newList;
    
    if (listName === 'cities') {
        newList = list.map(item => (item && (item as City).name === itemIdOrName) ? newItem : item);
    } else if (listName === 'specialties') {
        newList = list.map(item => item === itemIdOrName ? newItem : item);
    } else { // bank, expense, coupon
        newList = list.map(item => (item && (item as { id?: string }).id === itemIdOrName) ? { ...(item as object), ...(newItem as object) } : item);
    }

    await updateSetting(listName, newList);
  }, [settings, updateSetting]);

  const deleteListItem = useCallback(async (listName: 'cities' | 'specialties' | 'companyBankDetails' | 'companyExpenses' | 'coupons', itemToDeleteIdOrName: string) => {
    if (!settings) return;

    const list = (settings[listName] as unknown[]) || [];
    let newList;
    
    if (listName === 'cities') {
        newList = list.filter(item => item && (item as City).name !== itemToDeleteIdOrName);
    } else if (listName === 'specialties') {
        newList = list.filter(item => item !== itemToDeleteIdOrName);
    } else { // bank, expense, coupon
        newList = list.filter(item => item && (item as { id?: string }).id !== itemToDeleteIdOrName);
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
