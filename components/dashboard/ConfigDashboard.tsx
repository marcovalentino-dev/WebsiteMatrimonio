'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { useConfig } from '@/components/providers/ConfigProvider';
import { SectionOrderEditor } from '@/components/dashboard/SectionOrderEditor';
import { WeddingContent, SECTION_LABELS } from '@/components/site/WeddingContent';
import { defaultConfig } from '@/lib/config/defaultConfig';
import { SiteConfigSchema } from '@/lib/config/schema';
import { clearConfig, exportConfig, importConfigFromFile } from '@/lib/config/storage';
import { SectionKey } from '@/lib/config/types';

const tabs = ['Evento', 'Stile', 'Intro Letter', 'Sezioni & Ordine', 'RSVP', 'Gallery', 'Testi', 'SEO', 'Privacy', 'Backup'] as const;
type Tab = (typeof tabs)[number];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-[0.2em] text-[#766861]">{label}</span>
      {children}
    </label>
  );
}

const inputBase = 'w-full rounded-xl border border-black/15 bg-white/80 px-3 py-2 text-sm';

export function ConfigDashboard() {
  const { config, setConfig, save } = useConfig();
  const [activeTab, setActiveTab] = useState<Tab>('Evento');
  const [feedback, setFeedback] = useState('');

  const validationErrors = useMemo(() => {
    const parsed = SiteConfigSchema.safeParse(config);
    return parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  }, [config]);

  const patchFaq = (index: number, key: 'q' | 'a', value: string) => {
    setConfig((prev) => {
      const next = [...prev.texts.faqItems];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, texts: { ...prev.texts, faqItems: next } };
    });
  };

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importConfigFromFile(file);
      setConfig(parsed);
      setFeedback('Config importata correttamente.');
    } catch (error) {
      setFeedback(`Errore import: ${(error as Error).message}`);
    }
    event.target.value = '';
  };

  return (
    <main className="min-h-screen bg-[#f4eee8] px-3 py-4 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[520px_1fr]">
        <section className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-glass md:p-6">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#7f6f68]">Dashboard Segreta</p>
            <h1 className="mt-2 text-3xl">Wedding Config</h1>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab} className={`rounded-xl px-3 py-2 text-sm ${activeTab === tab ? 'bg-[#2f2622] text-white' : 'border border-black/10 bg-white/80'}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            {activeTab === 'Evento' && (
              <>
                <Field label="Nomi coppia"><input className={inputBase} value={config.event.coupleNames} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, coupleNames: e.target.value } }))} /></Field>
                <Field label="Data ISO"><input className={inputBase} type="datetime-local" value={config.event.dateISO.slice(0, 16)} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, dateISO: e.target.value } }))} /></Field>
                <Field label="Timezone"><input className={inputBase} value={config.event.timezone} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, timezone: e.target.value } }))} /></Field>
                <Field label="Dress Code"><input className={inputBase} value={config.event.dressCode} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, dressCode: e.target.value } }))} /></Field>
                <Field label="Note"><textarea className={inputBase} rows={3} value={config.event.notes} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, notes: e.target.value } }))} /></Field>
                <Field label="Cerimonia nome"><input className={inputBase} value={config.event.ceremony.name} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, ceremony: { ...p.event.ceremony, name: e.target.value } } }))} /></Field>
                <Field label="Cerimonia indirizzo"><input className={inputBase} value={config.event.ceremony.address} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, ceremony: { ...p.event.ceremony, address: e.target.value } } }))} /></Field>
                <Field label="Cerimonia città"><input className={inputBase} value={config.event.ceremony.city} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, ceremony: { ...p.event.ceremony, city: e.target.value } } }))} /></Field>
                <Field label="Cerimonia orario"><input className={inputBase} value={config.event.ceremony.time} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, ceremony: { ...p.event.ceremony, time: e.target.value } } }))} /></Field>
                <Field label="Ricevimento nome"><input className={inputBase} value={config.event.reception.name} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, reception: { ...p.event.reception, name: e.target.value } } }))} /></Field>
                <Field label="Ricevimento indirizzo"><input className={inputBase} value={config.event.reception.address} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, reception: { ...p.event.reception, address: e.target.value } } }))} /></Field>
                <Field label="Ricevimento città"><input className={inputBase} value={config.event.reception.city} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, reception: { ...p.event.reception, city: e.target.value } } }))} /></Field>
                <Field label="Ricevimento orario"><input className={inputBase} value={config.event.reception.time} onChange={(e) => setConfig((p) => ({ ...p, event: { ...p.event, reception: { ...p.event.reception, time: e.target.value } } }))} /></Field>
              </>
            )}

            {activeTab === 'Stile' && (
              <>
                {(['primary', 'secondary', 'background', 'surface', 'text'] as const).map((k) => (
                  <Field key={k} label={`Palette ${k}`}>
                    <div className="flex gap-2">
                      <input type="color" value={config.theme.palette[k]} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, palette: { ...p.theme.palette, [k]: e.target.value } } }))} />
                      <input className={inputBase} value={config.theme.palette[k]} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, palette: { ...p.theme.palette, [k]: e.target.value } } }))} />
                    </div>
                  </Field>
                ))}
                <Field label="Heading Font">
                  <select className={inputBase} value={config.theme.fontPairing.heading} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, fontPairing: { ...p.theme.fontPairing, heading: e.target.value as 'playfair' | 'cormorant' | 'prata' | 'lucida-handwriting' | 'segoe-script' | 'lucida-calligraphy' } } }))}>
                    <option value="playfair">Playfair Display</option>
                    <option value="cormorant">Cormorant Garamond</option>
                    <option value="prata">Prata</option>
                    <option value="lucida-handwriting">Lucida Handwriting</option>
                    <option value="segoe-script">Segoe Script</option>
                    <option value="lucida-calligraphy">Lucida Calligraphy</option>
                  </select>
                </Field>
                <Field label="Body Font">
                  <select className={inputBase} value={config.theme.fontPairing.body} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, fontPairing: { ...p.theme.fontPairing, body: e.target.value as 'manrope' | 'nunito' | 'montserrat' } } }))}>
                    <option value="manrope">Manrope</option>
                    <option value="nunito">Nunito Sans</option>
                    <option value="montserrat">Montserrat</option>
                  </select>
                </Field>
                <Field label="Radius"><input type="range" min={4} max={32} value={config.theme.radius} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, radius: Number(e.target.value) } }))} /></Field>
                <Field label="Shadow Intensity"><input type="range" min={0} max={100} value={config.theme.shadowIntensity} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, shadowIntensity: Number(e.target.value) } }))} /></Field>
                <Field label="Background Style">
                  <select className={inputBase} value={config.theme.backgroundStyle} onChange={(e) => setConfig((p) => ({ ...p, theme: { ...p.theme, backgroundStyle: e.target.value as 'gradient' | 'soft-noise' | 'minimal' } }))}>
                    <option value="gradient">Gradient</option>
                    <option value="soft-noise">Soft noise</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </Field>
              </>
            )}

            {activeTab === 'Intro Letter' && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.introLetter.enabled} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, enabled: e.target.checked } }))} /> Abilita Intro</label>
                <Field label="Envelope Style">
                  <select className={inputBase} value={config.introLetter.envelopeStyle} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, envelopeStyle: e.target.value as 'ivory' | 'rose' | 'midnight' } }))}>
                    <option value="ivory">Ivory</option>
                    <option value="rose">Rose</option>
                    <option value="midnight">Midnight</option>
                  </select>
                </Field>
                <Field label="Monogram Sigillo"><input className={inputBase} maxLength={4} value={config.introLetter.sealStyle} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, sealStyle: e.target.value } }))} /></Field>
                <Field label="Testo Intro"><textarea className={inputBase} rows={3} value={config.introLetter.introText} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, introText: e.target.value } }))} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.introLetter.playSound} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, playSound: e.target.checked } }))} /> Play click sound</label>
                <Field label="Animation Variant">
                  <select className={inputBase} value={config.introLetter.animationVariant} onChange={(e) => setConfig((p) => ({ ...p, introLetter: { ...p.introLetter, animationVariant: e.target.value as 'classic' | 'smooth' } }))}>
                    <option value="classic">Classic</option>
                    <option value="smooth">Smooth</option>
                  </select>
                </Field>
              </>
            )}

            {activeTab === 'Sezioni & Ordine' && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.sections.countdownEnabled} onChange={(e) => setConfig((p) => ({ ...p, sections: { ...p.sections, countdownEnabled: e.target.checked } }))} /> Countdown abilitato</label>
                <div className="space-y-2 rounded-xl border border-black/10 bg-white/60 p-3">
                  {(Object.keys(config.sections.enabledMap) as SectionKey[]).map((k) => (
                    <label key={k} className="flex items-center justify-between text-sm">
                      <span>{SECTION_LABELS[k]}</span>
                      <input type="checkbox" checked={config.sections.enabledMap[k]} onChange={(e) => setConfig((p) => ({ ...p, sections: { ...p.sections, enabledMap: { ...p.sections.enabledMap, [k]: e.target.checked } } }))} />
                    </label>
                  ))}
                </div>
                <SectionOrderEditor order={config.sections.order} onChange={(next) => setConfig((p) => ({ ...p, sections: { ...p.sections, order: next } }))} />
              </>
            )}

            {activeTab === 'RSVP' && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.rsvp.enabled} onChange={(e) => setConfig((p) => ({ ...p, rsvp: { ...p.rsvp, enabled: e.target.checked } }))} /> Abilita RSVP</label>
                <Field label="Deadline"><input className={inputBase} type="date" value={config.rsvp.deadlineISO} onChange={(e) => setConfig((p) => ({ ...p, rsvp: { ...p.rsvp, deadlineISO: e.target.value } }))} /></Field>
                <Field label="Recipient Email"><input className={inputBase} type="email" value={config.rsvp.recipientEmail} onChange={(e) => setConfig((p) => ({ ...p, rsvp: { ...p.rsvp, recipientEmail: e.target.value } }))} /></Field>
                <Field label="Submit Mode"><select className={inputBase} value={config.rsvp.submitMode} onChange={(e) => setConfig((p) => ({ ...p, rsvp: { ...p.rsvp, submitMode: e.target.value as 'mailto' | 'copyToClipboard' } }))}><option value="mailto">mailto</option><option value="copyToClipboard">copyToClipboard</option></select></Field>
                {(['name', 'plusOneCount', 'allergies', 'message'] as const).map((k) => (
                  <label key={k} className="flex items-center justify-between text-sm rounded-xl border border-black/10 bg-white/60 px-3 py-2">
                    <span>Campo {k}</span>
                    <input type="checkbox" checked={config.rsvp.fields[k]} onChange={(e) => setConfig((p) => ({ ...p, rsvp: { ...p.rsvp, fields: { ...p.rsvp.fields, [k]: e.target.checked } } }))} />
                  </label>
                ))}
              </>
            )}

            {activeTab === 'Gallery' && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.gallery.enabled} onChange={(e) => setConfig((p) => ({ ...p, gallery: { ...p.gallery, enabled: e.target.checked } }))} /> Abilita gallery</label>
                <Field label="Layout"><select className={inputBase} value={config.gallery.layout} onChange={(e) => setConfig((p) => ({ ...p, gallery: { ...p.gallery, layout: e.target.value as 'grid' | 'masonry' | 'slider' } }))}><option value="grid">grid</option><option value="masonry">masonry</option><option value="slider">slider</option></select></Field>
                <Field label="Guest Upload Link"><input className={inputBase} value={config.gallery.allowGuestUploadLink ?? ''} onChange={(e) => setConfig((p) => ({ ...p, gallery: { ...p.gallery, allowGuestUploadLink: e.target.value } }))} /></Field>
                <Field label="URLs immagini (1 per riga)"><textarea className={inputBase} rows={8} value={config.gallery.images.join('\n')} onChange={(e) => setConfig((p) => ({ ...p, gallery: { ...p.gallery, images: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) } }))} /></Field>
              </>
            )}

            {activeTab === 'Testi' && (
              <>
                <Field label="Hero subtitle"><textarea className={inputBase} rows={2} value={config.texts.heroSubtitle} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, heroSubtitle: e.target.value } }))} /></Field>
                <Field label="Story title"><input className={inputBase} value={config.texts.storyTitle} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, storyTitle: e.target.value } }))} /></Field>
                <Field label="Story body"><textarea className={inputBase} rows={3} value={config.texts.storyBody} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, storyBody: e.target.value } }))} /></Field>
                <Field label="Details title"><input className={inputBase} value={config.texts.detailsTitle} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, detailsTitle: e.target.value } }))} /></Field>
                <Field label="Descrizione ricevimento"><textarea className={inputBase} rows={3} value={config.texts.receptionDescription} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, receptionDescription: e.target.value } }))} /></Field>
                <Field label="Nota parcheggio ricevimento"><textarea className={inputBase} rows={2} value={config.texts.receptionParkingNote} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, receptionParkingNote: e.target.value } }))} /></Field>
                <Field label="Footer note"><input className={inputBase} value={config.texts.footerNote} onChange={(e) => setConfig((p) => ({ ...p, texts: { ...p.texts, footerNote: e.target.value } }))} /></Field>
                <div className="space-y-3">
                  {config.texts.faqItems.map((faq, idx) => (
                    <div key={idx} className="rounded-xl border border-black/10 bg-white/60 p-3">
                      <Field label={`FAQ ${idx + 1} domanda`}><input className={inputBase} value={faq.q} onChange={(e) => patchFaq(idx, 'q', e.target.value)} /></Field>
                      <Field label={`FAQ ${idx + 1} risposta`}><textarea className={inputBase} rows={2} value={faq.a} onChange={(e) => patchFaq(idx, 'a', e.target.value)} /></Field>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'SEO' && (
              <>
                <Field label="SEO title"><input className={inputBase} value={config.seo.title} onChange={(e) => setConfig((p) => ({ ...p, seo: { ...p.seo, title: e.target.value } }))} /></Field>
                <Field label="SEO description"><textarea className={inputBase} rows={3} value={config.seo.description} onChange={(e) => setConfig((p) => ({ ...p, seo: { ...p.seo, description: e.target.value } }))} /></Field>
                <Field label="OG image URL"><input className={inputBase} value={config.seo.ogImageUrl} onChange={(e) => setConfig((p) => ({ ...p, seo: { ...p.seo, ogImageUrl: e.target.value } }))} /></Field>
              </>
            )}

            {activeTab === 'Privacy' && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.privacy.showCookieBanner} onChange={(e) => setConfig((p) => ({ ...p, privacy: { ...p.privacy, showCookieBanner: e.target.checked } }))} /> Cookie banner</label>
                <Field label="RSVP disclaimer"><textarea className={inputBase} rows={3} value={config.privacy.rsvpDisclaimerText} onChange={(e) => setConfig((p) => ({ ...p, privacy: { ...p.privacy, rsvpDisclaimerText: e.target.value } }))} /></Field>
              </>
            )}

            {activeTab === 'Backup' && (
              <>
                <button className="w-full rounded-xl bg-[#312824] px-4 py-3 text-sm text-white" onClick={() => exportConfig(config)}>Export Config</button>
                <label className="block rounded-xl border border-dashed border-black/20 bg-white/70 px-4 py-3 text-center text-sm">
                  Import Config
                  <input type="file" accept="application/json" className="hidden" onChange={onImport} />
                </label>
                <button className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm" onClick={() => { clearConfig(); setConfig(defaultConfig); setFeedback('Config resettata ai default.'); }}>
                  Reset to defaults
                </button>
              </>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <button
              className="w-full rounded-xl bg-[linear-gradient(120deg,#6f4b3f,#2f5f6f)] px-4 py-3 text-sm font-semibold text-white"
              onClick={() => {
                const result = save();
                if (result.ok) {
                  exportConfig(config);
                  setFeedback('Configurazione valida. JSON scaricato.');
                } else {
                  setFeedback(result.error || 'Errore di validazione.');
                }
              }}
            >
              Save
            </button>
            {feedback ? <p className="text-sm text-[#463a35]">{feedback}</p> : null}
            {validationErrors.length > 0 ? (
              <div className="rounded-xl border border-[#b44f4f]/30 bg-[#fff0f0] p-3 text-xs text-[#6d2d2d]">
                {validationErrors.slice(0, 6).map((err) => (
                  <p key={err}>{err}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#65756d]">Schema Zod valido.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/70 p-2 shadow-glass md:p-3">
          <div className="mb-2 px-2 text-xs uppercase tracking-[0.22em] text-[#7d6f68]">Live Preview</div>
          <div className="max-h-[85vh] overflow-auto rounded-xl border border-black/10">
            <WeddingContent config={config} preview />
          </div>
        </section>
      </div>
    </main>
  );
}

