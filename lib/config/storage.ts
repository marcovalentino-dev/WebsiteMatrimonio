import { defaultConfig } from '@/lib/config/defaultConfig';
import { SiteConfigSchema } from '@/lib/config/schema';
import { SiteConfig } from '@/lib/config/types';

export const INTRO_SEEN_KEY = 'intro_seen_v1';

export function loadConfig(): SiteConfig {
  const validated = SiteConfigSchema.safeParse(defaultConfig);
  if (!validated.success) {
    return defaultConfig;
  }
  return validated.data;
}

export function saveConfig(config: SiteConfig): { ok: true } | { ok: false; error: string } {
  const validated = SiteConfigSchema.safeParse(config);
  if (!validated.success) {
    return { ok: false, error: validated.error.issues.map((i) => i.message).join('; ') };
  }
  return { ok: true };
}

export function clearConfig() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(INTRO_SEEN_KEY);
  }
}

export function exportConfig(config: SiteConfig) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wedding-config.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importConfigFromFile(file: File): Promise<SiteConfig> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return SiteConfigSchema.parse(parsed);
}
