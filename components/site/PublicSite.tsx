'use client';

import { useConfig } from '@/components/providers/ConfigProvider';
import { IntroGate } from '@/components/site/IntroGate';
import { WeddingContent } from '@/components/site/WeddingContent';

export function PublicSite() {
  const { config, loaded } = useConfig();

  if (!loaded) {
    return <main className="grid min-h-screen place-items-center text-sm text-[#7f6b64]">Loading...</main>;
  }

  return (
    <IntroGate intro={config.introLetter} coupleNames={config.event.coupleNames} dateISO={config.event.dateISO}>
      <WeddingContent config={config} />
    </IntroGate>
  );
}
