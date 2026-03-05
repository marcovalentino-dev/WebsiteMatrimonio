'use client';

import { CSSProperties, FormEvent, useMemo, useRef, useState } from 'react';

type CompanionType = 'Parente' | 'Bambino';

type Companion = {
  name: string;
  type: CompanionType;
};

type Palette = {
  steel: string;
  navy: string;
  cream: string;
  peach: string;
};

const defaultPalette: Palette = {
  steel: '#6e88a0',
  navy: '#2b4257',
  cream: '#f9dcca',
  peach: '#ecc4a8'
};

const INTRO_VIDEO_PATH = '/intro/intro.mp4';
const SOUNDTRACK_PATH = '/intro/soundtrack.mp3';

const eventInfo = {
  couple: 'Salvatore e Donatella',
  dateLabel: 'Mercoledi 30 Settembre 2026',
  church: {
    name: 'Chiesa',
    address: 'Piazza Santa Chiara 4, Napoli',
    time: '15:30'
  },
  restaurant: {
    name: 'Hotel San Francesco al Monte',
    address: 'Corso Vittorio Emanuele 328, Napoli',
    time: '17:00'
  }
};

const faqItems = [
  {
    question: 'Entro quando confermare la presenza?',
    answer: 'Ti chiediamo di compilare il modulo RSVP entro il 20 agosto 2026.'
  },
  {
    question: 'Posso aggiungere familiari o bambini?',
    answer: 'Si. Nel modulo RSVP puoi aggiungere tutte le persone che verranno con te.'
  },
  {
    question: 'Dove trovo le indicazioni stradali?',
    answer: 'Sotto alla sezione mappe trovi la mappa della chiesa e quella del ristorante.'
  }
];

function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HomePage() {
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);

  const [introState, setIntroState] = useState<'ready' | 'playing' | 'done'>('ready');
  const [introError, setIntroError] = useState(false);
  const [palette, setPalette] = useState<Palette>(defaultPalette);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const totalGuests = useMemo(() => 1 + companions.filter((item) => item.name.trim().length > 0).length, [companions]);

  const pageVars = {
    '--color-steel': palette.steel,
    '--color-navy': palette.navy,
    '--color-cream': palette.cream,
    '--color-peach': palette.peach
  } as CSSProperties;

  const blockStyle = {
    borderColor: hexToRgba(palette.navy, 0.22),
    backgroundColor: hexToRgba(palette.cream, 0.93),
    boxShadow: `0 16px 40px ${hexToRgba(palette.navy, 0.16)}`
  } as CSSProperties;

  const cardStyle = {
    borderColor: hexToRgba(palette.navy, 0.2),
    backgroundColor: hexToRgba('#ffffff', 0.8)
  } as CSSProperties;

  const inputStyle = {
    borderColor: hexToRgba(palette.navy, 0.35),
    color: palette.navy,
    backgroundColor: hexToRgba('#ffffff', 0.86)
  } as CSSProperties;

  const handlePaletteChange = (key: keyof Palette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  };

  const addCompanion = () => {
    setCompanions((prev) => [...prev, { name: '', type: 'Parente' }]);
  };

  const updateCompanion = (index: number, patch: Partial<Companion>) => {
    setCompanions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeCompanion = (index: number) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  const startIntro = async () => {
    const soundtrack = soundtrackRef.current;
    const introVideo = introVideoRef.current;

    if (soundtrack) {
      soundtrack.volume = 0.5;
      void soundtrack.play().catch(() => {
        // If blocked, user can still continue.
      });
    }

    if (!introVideo) {
      setIntroState('done');
      return;
    }

    try {
      introVideo.muted = true;
      introVideo.currentTime = 0;
      await introVideo.play();
      setIntroState('playing');
    } catch {
      setIntroError(true);
      setIntroState('done');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage('');

    const cleanCompanions = companions
      .map((item) => ({ ...item, name: item.name.trim() }))
      .filter((item) => item.name.length > 0);

    if (!firstName.trim() || !lastName.trim()) {
      setSubmitMessage('Inserisci nome e cognome per continuare.');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          allergies: allergies.trim(),
          companions: cleanCompanions
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setSubmitMessage(payload.message || 'Si e verificato un problema durante il salvataggio.');
        return;
      }

      setSubmitMessage('Conferma registrata correttamente. Grazie.');
      setFirstName('');
      setLastName('');
      setAllergies('');
      setCompanions([]);
    } catch {
      setSubmitMessage('Connessione non disponibile. Riprova tra qualche minuto.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={pageVars}>
      <audio ref={soundtrackRef} preload="auto" loop>
        <source src={SOUNDTRACK_PATH} type="audio/mpeg" />
      </audio>

      {introState !== 'done' && (
        <div className="fixed inset-0 z-[120] bg-black">
          <video
            ref={introVideoRef}
            className="h-full w-full object-contain"
            playsInline
            preload="auto"
            muted
            onEnded={() => setIntroState('done')}
            onError={() => setIntroError(true)}
          >
            <source src={INTRO_VIDEO_PATH} type="video/mp4" />
          </video>

          {introState === 'ready' && !introError && (
            <button
              type="button"
              onClick={() => void startIntro()}
              className="absolute inset-0 grid place-items-center bg-black/25"
              aria-label="Apri invito"
            >
              <span className="rounded-full border border-white/70 bg-black/60 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                Tap per aprire
              </span>
            </button>
          )}

          {introError && (
            <div className="absolute inset-0 grid place-items-center px-4">
              <button
                type="button"
                onClick={() => setIntroState('done')}
                className="rounded-xl border border-white/45 bg-black/40 px-5 py-3 text-sm text-white"
              >
                Continua al sito
              </button>
            </div>
          )}
        </div>
      )}

      <video
        className="fixed inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/background-poster.jpg"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div
        className="fixed inset-0"
        style={{
          background: `linear-gradient(180deg, ${hexToRgba(palette.navy, 0.66)} 0%, ${hexToRgba(palette.navy, 0.46)} 40%, ${hexToRgba(palette.navy, 0.58)} 100%)`
        }}
      />

      <button
        type="button"
        className="fixed right-3 top-3 z-[90] rounded-xl border px-4 py-2 text-sm font-semibold backdrop-blur"
        style={{ borderColor: hexToRgba(palette.navy, 0.35), backgroundColor: hexToRgba(palette.cream, 0.92), color: palette.navy }}
        onClick={() => setIsPaletteOpen((prev) => !prev)}
      >
        {isPaletteOpen ? 'Chiudi palette' : 'Apri palette'}
      </button>

      {isPaletteOpen && (
        <aside className="fixed right-3 top-16 z-[80] w-[300px] rounded-2xl border p-4 backdrop-blur" style={blockStyle}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.steel }}>
            Palette Sito
          </p>
          <div className="mt-3 space-y-2">
            <label className="grid grid-cols-[auto_44px_1fr] items-center gap-3 text-sm font-semibold" style={{ color: palette.navy }}>
              <span>Steel</span>
              <input type="color" value={palette.steel} onChange={(e) => handlePaletteChange('steel', e.target.value)} />
              <input className="rounded-md border px-2 py-1 text-xs font-mono" style={inputStyle} value={palette.steel} readOnly />
            </label>
            <label className="grid grid-cols-[auto_44px_1fr] items-center gap-3 text-sm font-semibold" style={{ color: palette.navy }}>
              <span>Navy</span>
              <input type="color" value={palette.navy} onChange={(e) => handlePaletteChange('navy', e.target.value)} />
              <input className="rounded-md border px-2 py-1 text-xs font-mono" style={inputStyle} value={palette.navy} readOnly />
            </label>
            <label className="grid grid-cols-[auto_44px_1fr] items-center gap-3 text-sm font-semibold" style={{ color: palette.navy }}>
              <span>Cream</span>
              <input type="color" value={palette.cream} onChange={(e) => handlePaletteChange('cream', e.target.value)} />
              <input className="rounded-md border px-2 py-1 text-xs font-mono" style={inputStyle} value={palette.cream} readOnly />
            </label>
            <label className="grid grid-cols-[auto_44px_1fr] items-center gap-3 text-sm font-semibold" style={{ color: palette.navy }}>
              <span>Peach</span>
              <input type="color" value={palette.peach} onChange={(e) => handlePaletteChange('peach', e.target.value)} />
              <input className="rounded-md border px-2 py-1 text-xs font-mono" style={inputStyle} value={palette.peach} readOnly />
            </label>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: hexToRgba(palette.navy, 0.35), color: palette.navy }}
            onClick={() => setPalette(defaultPalette)}
          >
            Ripristina palette
          </button>
        </aside>
      )}

      <div className="relative z-10 px-4 pb-8 pt-24 md:py-10">
        <header className="mx-auto w-full max-w-4xl rounded-2xl border p-5 text-center md:p-8" style={blockStyle}>
          <p className="text-sm uppercase tracking-[0.22em]" style={{ color: palette.steel }}>
            Invito al Matrimonio
          </p>
          <h1 className="mt-3 text-4xl leading-tight md:text-6xl" style={{ color: palette.navy }}>
            {eventInfo.couple}
          </h1>
          <p className="mt-4 text-xl md:text-2xl" style={{ color: palette.navy }}>
            {eventInfo.dateLabel}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed" style={{ color: hexToRgba(palette.navy, 0.87) }}>
            Benvenuti. In questa pagina trovate tutte le informazioni essenziali: orari, luoghi, mappe e conferma presenza.
          </p>
        </header>

        <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
          <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy }}>
            Informazioni della giornata
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border p-4" style={cardStyle}>
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: palette.steel }}>
                Chiesa
              </p>
              <p className="mt-2 text-2xl" style={{ color: palette.navy }}>
                {eventInfo.church.name}
              </p>
              <p className="mt-1 text-lg" style={{ color: palette.navy }}>
                {eventInfo.church.address}
              </p>
              <p className="mt-1 text-lg" style={{ color: palette.navy }}>
                Orario: {eventInfo.church.time}
              </p>
            </article>
            <article className="rounded-xl border p-4" style={cardStyle}>
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: palette.steel }}>
                Ristorante
              </p>
              <p className="mt-2 text-2xl" style={{ color: palette.navy }}>
                {eventInfo.restaurant.name}
              </p>
              <p className="mt-1 text-lg" style={{ color: palette.navy }}>
                {eventInfo.restaurant.address}
              </p>
              <p className="mt-1 text-lg" style={{ color: palette.navy }}>
                Orario: {eventInfo.restaurant.time}
              </p>
            </article>
          </div>
        </section>

        <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
          <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy }}>
            Conferma presenza (RSVP)
          </h2>
          <p className="mt-2 text-lg" style={{ color: hexToRgba(palette.navy, 0.86) }}>
            Compila il modulo. Se vieni con familiari o bambini, aggiungili qui sotto.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-base font-semibold" htmlFor="firstName" style={{ color: palette.navy }}>
                  Nome
                </label>
                <input id="firstName" className="w-full rounded-xl border px-4 py-3 text-base" style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-base font-semibold" htmlFor="lastName" style={{ color: palette.navy }}>
                  Cognome
                </label>
                <input id="lastName" className="w-full rounded-xl border px-4 py-3 text-base" style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-base font-semibold" htmlFor="allergies" style={{ color: palette.navy }}>
                Intolleranze o allergie
              </label>
              <textarea id="allergies" className="min-h-24 w-full rounded-xl border px-4 py-3 text-base" style={inputStyle} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Scrivi eventuali intolleranze alimentari. Se non presenti, inserisci: Nessuna" />
            </div>

            <div className="rounded-xl border p-4" style={cardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl" style={{ color: palette.navy }}>
                  Accompagnatori (+1, familiari, bambini)
                </h3>
                <button type="button" onClick={addCompanion} className="rounded-xl px-4 py-2 text-base text-white" style={{ backgroundColor: palette.navy }}>
                  Aggiungi persona
                </button>
              </div>

              {companions.length === 0 ? (
                <p className="mt-3 text-base" style={{ color: hexToRgba(palette.navy, 0.82) }}>
                  Nessun accompagnatore inserito.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {companions.map((item, index) => (
                    <div key={`${index}-${item.type}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto]" style={cardStyle}>
                      <input className="w-full rounded-xl border px-4 py-3 text-base" style={inputStyle} placeholder="Nome e cognome accompagnatore" value={item.name} onChange={(e) => updateCompanion(index, { name: e.target.value })} />
                      <select className="w-full rounded-xl border px-4 py-3 text-base" style={inputStyle} value={item.type} onChange={(e) => updateCompanion(index, { type: e.target.value as CompanionType })}>
                        <option value="Parente">Parente</option>
                        <option value="Bambino">Bambino</option>
                      </select>
                      <button type="button" className="rounded-xl border px-4 py-2 text-base" style={{ borderColor: hexToRgba(palette.navy, 0.35), color: palette.navy }} onClick={() => removeCompanion(index)}>
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-base font-semibold" style={{ color: palette.navy }}>
              Totale persone confermate: {totalGuests}
            </p>

            <button type="submit" disabled={isSending} className="rounded-xl px-6 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed" style={{ backgroundColor: palette.steel, opacity: isSending ? 0.7 : 1 }}>
              {isSending ? 'Salvataggio in corso...' : 'Invia conferma RSVP'}
            </button>

            {submitMessage ? (
              <p className="text-base font-semibold" style={{ color: palette.navy }}>
                {submitMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
          <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy }}>
            Mappe
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-lg font-semibold" style={{ color: palette.navy }}>
                Mappa Chiesa
              </p>
              <iframe title="Mappa Chiesa" src={mapEmbedUrl(eventInfo.church.address)} className="h-[320px] w-full rounded-xl border" style={{ borderColor: hexToRgba(palette.navy, 0.2) }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <div>
              <p className="mb-2 text-lg font-semibold" style={{ color: palette.navy }}>
                Mappa Ristorante
              </p>
              <iframe title="Mappa Ristorante" src={mapEmbedUrl(eventInfo.restaurant.address)} className="h-[320px] w-full rounded-xl border" style={{ borderColor: hexToRgba(palette.navy, 0.2) }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </section>

        <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
          <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy }}>
            Domande frequenti
          </h2>
          <div className="mt-4 space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-xl border p-4" style={cardStyle}>
                <summary className="cursor-pointer text-lg font-semibold" style={{ color: palette.navy }}>
                  {item.question}
                </summary>
                <p className="mt-2 text-lg" style={{ color: hexToRgba(palette.navy, 0.88) }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer className="relative z-10 mx-auto mt-6 w-full max-w-4xl rounded-2xl border p-5 text-center" style={{ borderColor: hexToRgba(palette.navy, 0.25), backgroundColor: palette.navy, color: palette.cream }}>
          <p className="text-xl">Con affetto, Salvatore e Donatella</p>
        </footer>
      </div>
    </main>
  );
}
