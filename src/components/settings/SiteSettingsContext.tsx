'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '@/lib/types';
import { db, initialSiteSettings } from '@/lib/data/mock-db';

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (updates: Partial<SiteSettings>) => void;
  resetToDefaults: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: initialSiteSettings,
  updateSettings: () => {},
  resetToDefaults: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire_site_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (db && typeof db.updateSettings === 'function') {
            db.updateSettings(parsed);
          }
          return parsed;
        } catch {
          // ignore parsing error
        }
      }
    }
    return (db && typeof db.getSettings === 'function') ? db.getSettings() : initialSiteSettings;
  });

  const updateSettings = (updates: Partial<SiteSettings>) => {
    const updated = (db && typeof db.updateSettings === 'function')
      ? db.updateSettings(updates)
      : { ...settings, ...updates, updated_at: new Date().toISOString() };
    setSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aspire_site_settings', JSON.stringify(updated));
    }
  };

  const resetToDefaults = () => {
    const reset = db.updateSettings(initialSiteSettings);
    setSettings(reset);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aspire_site_settings');
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
