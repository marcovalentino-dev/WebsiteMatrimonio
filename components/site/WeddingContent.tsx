'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { SiteConfig } from '@/lib/config/types';

const sectionLabels: Record<string, string> = {
  story: 'Our Journey',
  details: 'Dettagli',
  maps: 'Mappe',
  dressCode: 'Dress Code',
  faq: 'FAQ',
  gallery: 'Gallery',
  rsvp: 'RSVP',
  guestbook: 'Guestbook'
};

function SectionWrap({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-4 py-12 md:py-16">
      <div className="frost-card rounded-[var(--radius)] border border-white/40 p-6 shadow-glass md:p-8">
        <h2 className="mb-5 text-3xl md:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function resolveHeadingFont(key: SiteConfig['theme']['fontPairing']['heading']): string {
  switch (key) {
    case 'lucida-handwriting': return '"Lucida Handwriting", cursive';
    case 'segoe-script':       return '"Segoe Script", cursive';
    case 'lucida-calligraphy': return '"Lucida Calligraphy", cursive';
    case 'playfair':           return 'var(--font-playfair)';
    case 'cormorant':          return 'var(--font-cormorant)';
    default:                   return 'var(--font-prata)';
  }
}

function resolveBodyFont(key: SiteConfig['theme']['fontPairing']['body']): string {
  switch (key) {
    case 'nunito':     return 'var(--font-nunito)';
    case 'montserrat': return 'var(--font-montserrat)';
    default:           return 'var(--font-manrope)';
  }
}

export function WeddingContent({ config, preview = false }: { config: SiteConfig; preview?: boolean }) {
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookText, setGuestbookText] = useState('');
  const [rsvpState, setRsvpState] = useState({ name: '', plusOneCount: '0', allergies: '', message: '' });
  const [guestbookEntries, setGuestbookEntries] = useState<Array<{ name: string; text: string }>>(() => {
    if (preview || typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('guestbook_v1') || '[]');
    } catch {
      return [];
    }
  });

  const eventDate = useMemo(() => new Date(config.event.dateISO), [config.event.dateISO]);
  const now = new Date();
  const diff = Math.max(0, eventDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  const formattedDate = eventDate.toLocaleDateString('it-IT', { dateStyle: 'full' });
  const shortDate = (() => {
    const dd = String(eventDate.getDate()).padStart(2, '0');
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const yyyy = eventDate.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  })();

  const style = {
    '--color-primary': config.theme.palette.primary,
    '--color-secondary': config.theme.palette.secondary,
    '--color-bg': config.theme.palette.background,
    '--color-surface': config.theme.palette.surface,
    '--color-text': config.theme.palette.text,
    '--radius': `${config.theme.radius}px`,
    '--font-heading': resolveHeadingFont(config.theme.fontPairing.heading),
    '--font-body': resolveBodyFont(config.theme.fontPairing.body),
    boxShadow: `0 20px 60px rgba(0,0,0,${config.theme.shadowIntensity / 250})`
  } as React.CSSProperties;

  const mapsLink = (address: string, city: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`)}`;

  const renderByKey: Record<string, React.ReactNode> = {
    story: (
      <SectionWrap title={config.texts.storyTitle} id="story">
        <p className="leading-relaxed text-[color:var(--color-text)]/85">{config.texts.storyBody}</p>
      </SectionWrap>
    ),
    details: (
      <SectionWrap title={config.texts.detailsTitle} id="details">
        <div className="space-y-5">
          {/* La Cerimonia */}
          <div className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-secondary)]">La Cerimonia</p>
            <p className="mt-2 text-2xl">{config.event.ceremony.name}</p>
            <p className="mt-2 text-sm font-medium">Orario: {config.event.ceremony.time}</p>
            <p className="text-sm text-[color:var(--color-text)]/75">
              Location: {config.event.ceremony.address}, {config.event.ceremony.city}
            </p>
          </div>

          <div className="mx-auto h-px w-full border-t border-black/10" />

          {/* Il Ricevimento */}
          <div className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--color-secondary)]">Il Ricevimento</p>
            <p className="mt-2 text-2xl">{config.event.reception.name}</p>
            {config.texts.receptionDescription ? (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text)]/80">
                {config.texts.receptionDescription}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
              Location: {config.event.reception.address}, {config.event.reception.city}
            </p>
            {config.texts.receptionParkingNote ? (
              <p className="mt-3 text-sm italic text-[color:var(--color-text)]/65">
                {config.texts.receptionParkingNote}
              </p>
            ) : null}
          </div>
        </div>
      </SectionWrap>
    ),
    maps: (
      <SectionWrap title="Mappe" id="maps">
        <div className="grid gap-3 md:grid-cols-2">
          <a className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-4 hover:opacity-90" href={mapsLink(config.event.ceremony.address, config.event.ceremony.city)} target="_blank" rel="noreferrer">
            Apri mappa cerimonia
          </a>
          <a className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-4 hover:opacity-90" href={mapsLink(config.event.reception.address, config.event.reception.city)} target="_blank" rel="noreferrer">
            Apri mappa ricevimento
          </a>
        </div>
      </SectionWrap>
    ),
    dressCode: (
      <SectionWrap title="Dress Code" id="dress-code">
        <p>{config.event.dressCode}</p>
        <p className="mt-3 text-sm text-[color:var(--color-text)]/70">{config.event.notes}</p>
      </SectionWrap>
    ),
    faq: (
      <SectionWrap title="FAQ" id="faq">
        <div className="space-y-3">
          {config.texts.faqItems.map((item, idx) => (
            <details key={`${item.q}-${idx}`} className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </SectionWrap>
    ),
    gallery:
      config.gallery.enabled && config.sections.enabledMap.gallery ? (
        <SectionWrap title="Gallery" id="gallery">
          {config.gallery.layout === 'grid' && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {config.gallery.images.map((src) => (
                <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius)]">
                  <Image src={src} alt="Wedding memory" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {config.gallery.layout === 'masonry' && (
            <div className="masonry">
              {config.gallery.images.map((src) => (
                <div key={src} className="masonry-item relative overflow-hidden rounded-[var(--radius)]">
                  <Image src={src} alt="Wedding memory" width={700} height={900} className="h-auto w-full" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {config.gallery.layout === 'slider' && (
            <div className="flex snap-x gap-3 overflow-x-auto pb-2">
              {config.gallery.images.map((src) => (
                <div key={src} className="relative h-[380px] min-w-[260px] snap-start overflow-hidden rounded-[var(--radius)] md:min-w-[320px]">
                  <Image src={src} alt="Wedding memory" fill sizes="320px" className="object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {config.gallery.allowGuestUploadLink ? (
            <a className="mt-4 inline-block text-sm underline" href={config.gallery.allowGuestUploadLink} target="_blank" rel="noreferrer">
              Carica foto come invitato
            </a>
          ) : null}
        </SectionWrap>
      ) : null,
    rsvp:
      config.rsvp.enabled && config.sections.enabledMap.rsvp ? (
        <SectionWrap title="RSVP" id="rsvp">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const lines = [
                `Nome: ${rsvpState.name}`,
                `Accompagnatori: ${rsvpState.plusOneCount}`,
                `Allergie: ${rsvpState.allergies}`,
                `Messaggio: ${rsvpState.message}`
              ];
              const content = lines.join('\n');
              if (config.rsvp.submitMode === 'mailto') {
                window.location.href = `mailto:${config.rsvp.recipientEmail}?subject=RSVP%20Wedding&body=${encodeURIComponent(content)}`;
              } else {
                await navigator.clipboard.writeText(content);
                window.alert('Dettagli RSVP copiati negli appunti.');
              }
            }}
          >
            {config.rsvp.fields.name && <input className="w-full rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" placeholder="Nome e cognome" value={rsvpState.name} onChange={(e) => setRsvpState((s) => ({ ...s, name: e.target.value }))} required />}
            {config.rsvp.fields.plusOneCount && <input className="w-full rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" type="number" min={0} placeholder="Numero accompagnatori" value={rsvpState.plusOneCount} onChange={(e) => setRsvpState((s) => ({ ...s, plusOneCount: e.target.value }))} />}
            {config.rsvp.fields.allergies && <input className="w-full rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" placeholder="Allergie o intolleranze" value={rsvpState.allergies} onChange={(e) => setRsvpState((s) => ({ ...s, allergies: e.target.value }))} />}
            {config.rsvp.fields.message && <textarea className="w-full rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" placeholder="Messaggio" rows={4} value={rsvpState.message} onChange={(e) => setRsvpState((s) => ({ ...s, message: e.target.value }))} />}
            <p className="text-sm font-medium text-[color:var(--color-text)]/80">
              Entro quando confermare la presenza?
            </p>
            <p className="text-sm text-[color:var(--color-text)]/70">
              Ti chiediamo di compilare il modulo RSVP entro il {new Date(config.rsvp.deadlineISO).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <p className="text-xs text-[color:var(--color-text)]/60">{config.privacy.rsvpDisclaimerText}</p>
            <button className="rounded-[var(--radius)] bg-[color:var(--color-primary)] px-5 py-3 text-white" type="submit">
              Invia RSVP
            </button>
          </form>
        </SectionWrap>
      ) : null,
    guestbook: (
      <SectionWrap title="Guestbook" id="guestbook">
        <form
          className="mb-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!guestbookName || !guestbookText) return;
            const next = [{ name: guestbookName, text: guestbookText }, ...guestbookEntries].slice(0, 40);
            setGuestbookEntries(next);
            setGuestbookName('');
            setGuestbookText('');
            if (!preview && typeof window !== 'undefined') window.localStorage.setItem('guestbook_v1', JSON.stringify(next));
          }}
        >
          <input className="rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" placeholder="Nome" value={guestbookName} onChange={(e) => setGuestbookName(e.target.value)} />
          <input className="rounded-[var(--radius)] border border-black/15 bg-white/70 p-3" placeholder="Il tuo messaggio" value={guestbookText} onChange={(e) => setGuestbookText(e.target.value)} />
          <button className="rounded-[var(--radius)] bg-[color:var(--color-secondary)] px-4 py-3 text-white" type="submit">Pubblica</button>
        </form>
        <div className="space-y-2">
          {guestbookEntries.length === 0 ? <p className="text-sm text-[color:var(--color-text)]/65">Nessun messaggio ancora.</p> : guestbookEntries.map((entry, idx) => (
            <div key={`${entry.name}-${idx}`} className="rounded-[var(--radius)] border border-black/10 bg-[color:var(--color-surface)] p-3">
              <p className="font-medium">{entry.name}</p>
              <p className="text-sm">{entry.text}</p>
            </div>
          ))}
        </div>
      </SectionWrap>
    )
  };

  return (
    <main
      className={`relative min-h-screen text-[color:var(--color-text)] ${config.theme.backgroundStyle === 'gradient' ? 'bg-style-gradient' : config.theme.backgroundStyle === 'soft-noise' ? 'bg-style-soft-noise' : 'bg-style-minimal'}`}
      style={style}
    >
      {/* Background video (only on public site, not preview) */}
      {!preview && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      <header className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 md:pt-20">
        <div className="frost-card overflow-hidden rounded-[var(--radius)] border border-white/50 p-8 shadow-glass md:p-12">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[color:var(--color-secondary)]">{shortDate}</p>
          <h1 className="text-4xl leading-tight md:text-6xl">{config.event.coupleNames}</h1>
          <p className="mt-2 text-base capitalize text-[color:var(--color-text)]/70 md:text-lg">{formattedDate}</p>
          <p className="mt-4 max-w-xl whitespace-pre-line text-[color:var(--color-text)]/75">{config.texts.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {config.rsvp.enabled && (
              <a href="#rsvp" className="rounded-[var(--radius)] bg-[color:var(--color-primary)] px-5 py-3 text-sm font-medium text-white">RSVP</a>
            )}
            <a href="#details" className="rounded-[var(--radius)] border border-black/15 bg-white/65 px-5 py-3 text-sm font-medium">Dettagli</a>
          </div>
          {config.sections.countdownEnabled && (
            <div className="mt-8 flex gap-4 text-center">
              <div className="rounded-[var(--radius)] bg-white/70 px-4 py-3">
                <p className="text-2xl font-semibold">{days}</p>
                <p className="text-xs uppercase tracking-[0.25em]">Giorni</p>
              </div>
              <div className="rounded-[var(--radius)] bg-white/70 px-4 py-3">
                <p className="text-2xl font-semibold">{hours}</p>
                <p className="text-xs uppercase tracking-[0.25em]">Ore</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {config.sections.order.map((key) => (config.sections.enabledMap[key] ? <div key={key}>{renderByKey[key]}</div> : null))}

      <footer className="mx-auto max-w-5xl px-4 pb-14">
        <div className="frost-card rounded-[var(--radius)] border border-white/40 p-6 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[color:var(--color-secondary)]">Thank You</p>
          <p>{config.texts.footerNote}</p>
        </div>
      </footer>

      {config.privacy.showCookieBanner && !preview ? (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-[var(--radius)] bg-[#1f1a19] px-4 py-3 text-xs text-[#f6ece5] shadow-2xl">
          Questo sito utilizza solo storage locale per migliorare la tua esperienza.
        </div>
      ) : null}
    </main>
  );
}

export const SECTION_LABELS = sectionLabels;
