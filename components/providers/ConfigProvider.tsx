'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultConfig } from '@/lib/config/defaultConfig';
import { SiteConfigSchema } from '@/lib/config/schema';
import { loadConfig } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

type ConfigContextValue = {
  config: SiteConfig;
  loaded: boolean;
  setConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  save: () => { ok: boolean; error?: string };
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
    setLoaded(true);
  }, []);

  const value = useMemo(
    () => ({
      config,
      loaded,
      setConfig,
      save: () => {
        const parsed = SiteConfigSchema.safeParse(config);
        if (!parsed.success) {
          return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ') };
        }
        return { ok: true };
      }
    }),
    [config, loaded]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider');
  return ctx;
}
