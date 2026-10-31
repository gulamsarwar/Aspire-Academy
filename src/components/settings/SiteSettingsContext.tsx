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
    return (db && typeof db.getSettings === 'function') ? db.getSettings() : initialSiteSettings;
  });

  useEffect(() => {
    // 1. Instant load from localStorage for zero initial latency
    try {
      const saved = localStorage.getItem('aspire_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (db && typeof db.updateSettings === 'function') {
          db.updateSettings(parsed);
        }
        setSettings(parsed);
      }
    } catch {
      // ignore
    }

    // 2. Fetch live settings from Supabase Cloud PostgreSQL via /api/settings
    let isMounted = true;
    async function loadLiveSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.settings) {
            setSettings(data.settings);
            if (db && typeof db.updateSettings === 'function') {
              db.updateSettings(data.settings);
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('aspire_site_settings', JSON.stringify(data.settings));
            }
          }
        }
      } catch {
        // network offline, continue with cached settings
      }
    }
    loadLiveSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = (updates: Partial<SiteSettings>) => {
    const updated = (db && typeof db.updateSettings === 'function')
      ? db.updateSettings(updates)
      : { ...settings, ...updates, updated_at: new Date().toISOString() };
    setSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aspire_site_settings', JSON.stringify(updated));
    }

    // Async sync to Supabase Cloud PostgreSQL
    const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('aspire_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.id) syncHeaders['x-aspire-admin-id'] = u.id;
          if (u.email) syncHeaders['x-aspire-admin-email'] = u.email;
        }
      } catch {
        // ignore
      }
    }

    fetch('/api/admin/settings', {
      method: 'POST',
      headers: syncHeaders,
      body: JSON.stringify(updated),
    }).catch(() => null);
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
