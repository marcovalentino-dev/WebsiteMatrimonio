'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type CompanionType = 'Parente' | 'Bambino';
type Companion = { name: string; type: CompanionType };
type Palette = { steel: string; navy: string; cream: string; peach: string };
type FontKey = 'lucida-handwriting' | 'segoe-script' | 'lucida-calligraphy';

// ─── Constants ────────────────────────────────────────────────────────────────
const INTRO_VIDEO_PATH = '/intro/intro.mp4';
const SOUNDTRACK_PATH = '/intro/soundtrack.mp3';
const MUTE_AFTER_MS = 60_000;

const DEFAULT_PALETTE: Palette = {
  steel: '#6e88a0',
  navy: '#2b4257',
  cream: '#f9dcca',
  peach: '#ecc4a8'
};

const FONTS: { id: FontKey; label: string; css: string }[] = [
  { id: 'lucida-handwriting', label: 'Lucida Handwriting', css: '"Lucida Handwriting", cursive' },
  { id: 'segoe-script',       label: 'Segoe Script',       css: '"Segoe Script", cursive' },
  { id: 'lucida-calligraphy', label: 'Lucida Calligraphy', css: '"Lucida Calligraphy", cursive' },
];

// ─── Wedding content ──────────────────────────────────────────────────────────
const CONTENT = {
  coupleNames: 'Salvatore & Donatella',
  shortDate: '30.09.2026',
  heroSubtitle:
    'Mercoledì 30 Settembre 2026 scriveremo un nuovo capitolo della nostra storia d\'amore e saremmo onorati di avervi al nostro fianco.\nAbbiamo creato questa pagina per guidarvi tra i luoghi e i momenti del nostro "Sì".\nConsultate le informazioni e fateci sapere se sarete dei nostri.',
  ceremony: {
    name: 'Chiesa di Santa Lucia Vergine al Monte',
    time: '11.15',
    address: 'Corso Vittorio Emanuele, 328, 80135 Napoli NA',
    mapsQuery: 'Chiesa di Santa Lucia Vergine al Monte, Corso Vittorio Emanuele 328, Napoli',
  },
  reception: {
    name: 'Hotel San Francesco al Monte',
    description:
      "Dopo la celebrazione, il ricevimento si terrà a pochi passi dalla Chiesa, presso l'Hotel San Francesco al Monte, un antico monastero affacciato sul Golfo.",
    address: 'Corso Vittorio Emanuele, 328, 80135 Napoli NA',
    parkingNote:
      'Data la bellezza e la particolarità del Corso Vittorio Emanuele, vi consigliamo di arrivare con un leggero anticipo per godervi il panorama e facilitare il parcheggio.',
    mapsQuery: 'Hotel San Francesco al Monte, Corso Vittorio Emanuele 328, Napoli',
  },
  rsvpDeadline: '1 agosto 2026',
  faq: [
    {
      q: 'Entro quando confermare la presenza?',
      a: 'Ti chiediamo di compilare il modulo RSVP entro il 1 agosto 2026.',
    },
    {
      q: 'Posso aggiungere familiari o bambini?',
      a: 'Sì. Nel modulo RSVP puoi aggiungere tutte le persone che verranno con te.',
    },
    {
      q: 'Dove trovo le indicazioni stradali?',
      a: "Nella sezione Mappe trovi la posizione della Chiesa e dell'Hotel.",
    },
  ],
} as const;

// ─── Utilities ────────────────────────────────────────────────────────────────
function mapEmbedUrl(q: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function hex(hex: string, a: number) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const v = parseInt(full, 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const muteTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 'idle' → SSR guard; 'ready' → tap button; 'playing' → video runs;
  // 'entering' → names animation; 'done' → full site visible
  const [phase, setPhase]           = useState<'idle' | 'ready' | 'playing' | 'entering' | 'done'>('idle');
  const [introError, setIntroError]  = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [isMuted, setIsMuted]        = useState(false);

  // Settings panel
  const [palette, setPalette]        = useState<Palette>(DEFAULT_PALETTE);
  const [font, setFont]              = useState<FontKey>('lucida-handwriting');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // RSVP form
  const [firstName, setFirstName]    = useState('');
  const [lastName, setLastName]      = useState('');
  const [allergies, setAllergies]    = useState('');
  const [companions, setCompanions]  = useState<Companion[]>([]);
  const [isSending, setIsSending]    = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const totalGuests = useMemo(
    () => 1 + companions.filter((c) => c.name.trim().length > 0).length,
    [companions],
  );

  // Client-side mount
  useEffect(() => { setPhase('ready'); }, []);

  // Names animation timer: entering → done after 5 s
  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('done'), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  // Auto-mute soundtrack after 60 s
  useEffect(() => {
    if (!audioStarted) return;
    muteTimerRef.current = setTimeout(() => {
      const a = soundtrackRef.current;
      if (a && !a.muted) { a.muted = true; setIsMuted(true); }
    }, MUTE_AFTER_MS);
    return () => { if (muteTimerRef.current) clearTimeout(muteTimerRef.current); };
  }, [audioStarted]);

  const startIntro = async () => {
    setAudioStarted(true);
    const soundtrack = soundtrackRef.current;
    if (soundtrack) { soundtrack.volume = 0.55; void soundtrack.play().catch(() => {}); }

    const video = introVideoRef.current;
    if (!video) { setPhase('entering'); return; }
    try {
      video.muted = true;
      video.currentTime = 0;
      await video.play();
      setPhase('playing');
    } catch {
      setIntroError(true);
      setPhase('entering');
    }
  };

  const toggleMute = () => {
    const a = soundtrackRef.current;
    if (!a) return;
    if (muteTimerRef.current) { clearTimeout(muteTimerRef.current); muteTimerRef.current = null; }
    a.muted = !a.muted;
    setIsMuted(a.muted);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage('');
    const clean = companions.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name.length > 0);
    if (!firstName.trim() || !lastName.trim()) { setSubmitMessage('Inserisci nome e cognome per continuare.'); return; }
    setIsSending(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), allergies: allergies.trim(), companions: clean }),
      });
      const payload = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !payload.ok) { setSubmitMessage(payload.message || 'Si è verificato un problema.'); return; }
      setSubmitMessage('Conferma registrata correttamente. Grazie.');
      setFirstName(''); setLastName(''); setAllergies(''); setCompanions([]);
    } catch {
      setSubmitMessage('Connessione non disponibile. Riprova tra qualche minuto.');
    } finally {
      setIsSending(false);
    }
  };

  if (phase === 'idle') return null;

  const headingCss = FONTS.find((f) => f.id === font)?.css ?? FONTS[0].css;
  const blockStyle: CSSProperties = {
    borderColor: hex(palette.navy, 0.22),
    backgroundColor: hex(palette.cream, 0.93),
    boxShadow: `0 16px 40px ${hex(palette.navy, 0.16)}`,
  };
  const cardStyle: CSSProperties  = { borderColor: hex(palette.navy, 0.2), backgroundColor: hex('#ffffff', 0.8) };
  const inputStyle: CSSProperties = { borderColor: hex(palette.navy, 0.35), color: palette.navy, backgroundColor: hex('#ffffff', 0.86) };

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <audio ref={soundtrackRef} preload="auto" loop>
        <source src={SOUNDTRACK_PATH} type="audio/mpeg" />
      </audio>

      {/* ── Intro video overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'ready' || phase === 'playing') && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[120] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {!introError ? (
              <>
                <video
                  ref={introVideoRef}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="auto"
                  muted
                  onEnded={() => setPhase('entering')}
                  onError={() => { setIntroError(true); setPhase('entering'); }}
                >
                  <source src={INTRO_VIDEO_PATH} type="video/mp4" />
                </video>
                {phase === 'ready' && (
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
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center px-4">
                <button
                  type="button"
                  onClick={() => void startIntro()}
                  className="rounded-xl border border-white/45 bg-black/40 px-5 py-3 text-sm text-white"
                >
                  Continua al sito
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background video (entering + done) ──────────────────────────── */}
      {(phase === 'entering' || phase === 'done') && (
        <>
          <video
            className="fixed inset-0 h-full w-full object-cover"
            autoPlay muted loop playsInline
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
          <div
            className="fixed inset-0"
            style={{
              background: `linear-gradient(180deg, ${hex(palette.navy, 0.66)} 0%, ${hex(palette.navy, 0.46)} 40%, ${hex(palette.navy, 0.58)} 100%)`,
            }}
          />
        </>
      )}

      {/* ── Names animation overlay (entering) ──────────────────────────── */}
      <AnimatePresence>
        {phase === 'entering' && (
          <motion.div
            key="names-overlay"
            className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/55 px-6"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          >
            <motion.div
              className="mb-6 h-px w-24 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1.2 }}
            />
            <motion.h1
              className="text-center text-5xl leading-tight tracking-wide text-white drop-shadow-lg md:text-7xl"
              style={{ fontFamily: headingCss }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.6, ease: 'easeOut' }}
            >
              {CONTENT.coupleNames}
            </motion.h1>
            <motion.p
              className="mt-5 text-center text-xl tracking-[0.25em] text-white/75 md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1.4, ease: 'easeOut' }}
            >
              {CONTENT.shortDate}
            </motion.p>
            <motion.div
              className="mt-6 h-px w-24 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mute toggle (visible after audio started) ────────────────────── */}
      {audioStarted && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Attiva audio' : 'Silenzia audio'}
          className="fixed left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          {isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* ── Settings button ──────────────────────────────────────────────── */}
      {phase === 'done' && (
        <button
          type="button"
          className="fixed right-3 top-3 z-[90] rounded-xl border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition"
          style={{ borderColor: hex(palette.navy, 0.35), backgroundColor: hex(palette.cream, 0.92), color: palette.navy }}
          onClick={() => setIsSettingsOpen((p) => !p)}
        >
          {isSettingsOpen ? 'Chiudi' : '⚙ Impostazioni'}
        </button>
      )}

      {/* ── Settings panel (palette + font picker) ───────────────────────── */}
      {isSettingsOpen && phase === 'done' && (
        <aside
          className="fixed right-3 top-14 z-[80] w-[300px] overflow-y-auto rounded-2xl border p-4 backdrop-blur-sm"
          style={blockStyle}
        >
          {/* Palette */}
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.steel }}>
            Palette
          </p>
          <div className="mt-2 space-y-2">
            {(['steel', 'navy', 'cream', 'peach'] as const).map((k) => (
              <label key={k} className="grid grid-cols-[50px_44px_1fr] items-center gap-2 text-sm font-semibold" style={{ color: palette.navy }}>
                <span className="capitalize">{k}</span>
                <input type="color" value={palette[k]} onChange={(e) => setPalette((p) => ({ ...p, [k]: e.target.value }))} className="h-8 w-full cursor-pointer rounded border-0 p-0" />
                <input className="rounded-md border px-2 py-1 text-xs font-mono" style={inputStyle} value={palette[k]} readOnly />
              </label>
            ))}
            <button
              type="button"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-semibold transition"
              style={{ borderColor: hex(palette.navy, 0.35), color: palette.navy }}
              onClick={() => setPalette(DEFAULT_PALETTE)}
            >
              Ripristina palette
            </button>
          </div>

          {/* Font picklist */}
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.steel }}>
            Font titoli
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {FONTS.map(({ id, label, css }) => {
              const active = font === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFont(id)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition-all"
                  style={{
                    borderColor: active ? palette.navy : hex(palette.navy, 0.15),
                    backgroundColor: active ? palette.navy : hex('#ffffff', 0.7),
                    color: active ? palette.cream : palette.navy,
                  }}
                >
                  <span style={{ fontFamily: css }} className="block text-2xl leading-none">Aa</span>
                  <span className="mt-1 block text-[9px] leading-tight opacity-80">{label}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* ── Main content (fades in when phase = done) ────────────────────── */}
      {(phase === 'entering' || phase === 'done') && (
        <motion.div
          className="relative z-10 px-4 pb-8 pt-24 md:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'done' ? 1 : 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          {/* Header / invito */}
          <header className="mx-auto w-full max-w-4xl rounded-2xl border p-5 text-center md:p-8" style={blockStyle}>
            <h1
              className="text-4xl leading-tight md:text-6xl"
              style={{ color: palette.navy, fontFamily: headingCss }}
            >
              {CONTENT.coupleNames}
            </h1>
            <p className="mt-2 text-sm uppercase tracking-[0.35em]" style={{ color: palette.steel }}>
              {CONTENT.shortDate}
            </p>
            <p
              className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-lg leading-relaxed"
              style={{ color: hex(palette.navy, 0.87) }}
            >
              {CONTENT.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="#rsvp"
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
                style={{ backgroundColor: palette.navy }}
              >
                RSVP
              </a>
              <a
                href="#programma"
                className="rounded-xl border px-5 py-3 text-sm font-semibold transition"
                style={{ borderColor: hex(palette.navy, 0.35), color: palette.navy, backgroundColor: hex(palette.cream, 0.8) }}
              >
                Il Programma
              </a>
            </div>
          </header>

          {/* Il Programma della Giornata */}
          <section id="programma" className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
            <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy, fontFamily: headingCss }}>
              Il Programma della Giornata
            </h2>

            <div className="mt-5 space-y-5">
              {/* Cerimonia */}
              <article className="rounded-xl border p-5" style={cardStyle}>
                <p className="text-xs uppercase tracking-[0.25em]" style={{ color: palette.steel }}>
                  La Cerimonia
                </p>
                <p className="mt-2 text-2xl" style={{ color: palette.navy, fontFamily: headingCss }}>
                  {CONTENT.ceremony.name}
                </p>
                <p className="mt-2 text-sm font-medium" style={{ color: palette.navy }}>
                  Orario: {CONTENT.ceremony.time}
                </p>
                <p className="text-sm" style={{ color: hex(palette.navy, 0.7) }}>
                  Location: {CONTENT.ceremony.address}
                </p>
              </article>

              <div className="h-px w-full" style={{ backgroundColor: hex(palette.navy, 0.1) }} />

              {/* Ricevimento */}
              <article className="rounded-xl border p-5" style={cardStyle}>
                <p className="text-xs uppercase tracking-[0.25em]" style={{ color: palette.steel }}>
                  Il Ricevimento
                </p>
                <p className="mt-2 text-2xl" style={{ color: palette.navy, fontFamily: headingCss }}>
                  {CONTENT.reception.name}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: hex(palette.navy, 0.8) }}>
                  {CONTENT.reception.description}
                </p>
                <p className="mt-2 text-sm" style={{ color: hex(palette.navy, 0.7) }}>
                  Location: {CONTENT.reception.address}
                </p>
                <p className="mt-3 text-sm italic" style={{ color: hex(palette.navy, 0.62) }}>
                  {CONTENT.reception.parkingNote}
                </p>
              </article>
            </div>
          </section>

          {/* RSVP */}
          <section id="rsvp" className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
            <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy, fontFamily: headingCss }}>
              Conferma Presenza
            </h2>
            <p className="mt-2 text-sm font-semibold" style={{ color: palette.navy }}>
              Entro quando confermare la presenza?
            </p>
            <p className="text-sm" style={{ color: hex(palette.navy, 0.72) }}>
              Ti chiediamo di compilare il modulo RSVP entro il {CONTENT.rsvpDeadline}.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-base font-semibold" htmlFor="firstName" style={{ color: palette.navy }}>
                    Nome
                  </label>
                  <input
                    id="firstName"
                    className="w-full rounded-xl border px-4 py-3 text-base"
                    style={inputStyle}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-base font-semibold" htmlFor="lastName" style={{ color: palette.navy }}>
                    Cognome
                  </label>
                  <input
                    id="lastName"
                    className="w-full rounded-xl border px-4 py-3 text-base"
                    style={inputStyle}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-base font-semibold" htmlFor="allergies" style={{ color: palette.navy }}>
                  Intolleranze o allergie
                </label>
                <textarea
                  id="allergies"
                  className="min-h-24 w-full rounded-xl border px-4 py-3 text-base"
                  style={inputStyle}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Eventuali intolleranze alimentari. Se nessuna: Nessuna"
                />
              </div>

              <div className="rounded-xl border p-4" style={cardStyle}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl" style={{ color: palette.navy }}>
                    Accompagnatori
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCompanions((p) => [...p, { name: '', type: 'Parente' }])}
                    className="rounded-xl px-4 py-2 text-base text-white transition"
                    style={{ backgroundColor: palette.navy }}
                  >
                    Aggiungi persona
                  </button>
                </div>
                {companions.length === 0 ? (
                  <p className="mt-3 text-base" style={{ color: hex(palette.navy, 0.75) }}>
                    Nessun accompagnatore inserito.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {companions.map((item, i) => (
                      <div key={`${i}-${item.type}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto]" style={cardStyle}>
                        <input
                          className="w-full rounded-xl border px-4 py-3 text-base"
                          style={inputStyle}
                          placeholder="Nome e cognome"
                          value={item.name}
                          onChange={(e) => setCompanions((p) => p.map((c, idx) => (idx === i ? { ...c, name: e.target.value } : c)))}
                        />
                        <select
                          className="w-full rounded-xl border px-4 py-3 text-base"
                          style={inputStyle}
                          value={item.type}
                          onChange={(e) => setCompanions((p) => p.map((c, idx) => (idx === i ? { ...c, type: e.target.value as CompanionType } : c)))}
                        >
                          <option value="Parente">Parente</option>
                          <option value="Bambino">Bambino</option>
                        </select>
                        <button
                          type="button"
                          className="rounded-xl border px-4 py-2 text-base transition"
                          style={{ borderColor: hex(palette.navy, 0.35), color: palette.navy }}
                          onClick={() => setCompanions((p) => p.filter((_, idx) => idx !== i))}
                        >
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

              <button
                type="submit"
                disabled={isSending}
                className="rounded-xl px-6 py-3 text-lg font-semibold text-white transition disabled:cursor-not-allowed"
                style={{ backgroundColor: palette.steel, opacity: isSending ? 0.7 : 1 }}
              >
                {isSending ? 'Salvataggio in corso…' : 'Invia conferma RSVP'}
              </button>

              {submitMessage && (
                <p className="text-base font-semibold" style={{ color: palette.navy }}>
                  {submitMessage}
                </p>
              )}
            </form>
          </section>

          {/* Mappe */}
          <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
            <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy, fontFamily: headingCss }}>
              Mappe
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-lg font-semibold" style={{ color: palette.navy }}>
                  Chiesa
                </p>
                <iframe
                  title="Mappa Chiesa"
                  src={mapEmbedUrl(CONTENT.ceremony.mapsQuery)}
                  className="h-[320px] w-full rounded-xl border"
                  style={{ borderColor: hex(palette.navy, 0.2) }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div>
                <p className="mb-2 text-lg font-semibold" style={{ color: palette.navy }}>
                  Hotel
                </p>
                <iframe
                  title="Mappa Hotel"
                  src={mapEmbedUrl(CONTENT.reception.mapsQuery)}
                  className="h-[320px] w-full rounded-xl border"
                  style={{ borderColor: hex(palette.navy, 0.2) }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mx-auto mt-5 w-full max-w-4xl rounded-2xl border p-5 md:p-8" style={blockStyle}>
            <h2 className="text-3xl md:text-4xl" style={{ color: palette.navy, fontFamily: headingCss }}>
              Domande frequenti
            </h2>
            <div className="mt-4 space-y-3">
              {CONTENT.faq.map((item) => (
                <details key={item.q} className="rounded-xl border p-4" style={cardStyle}>
                  <summary className="cursor-pointer text-lg font-semibold" style={{ color: palette.navy }}>
                    {item.q}
                  </summary>
                  <p className="mt-2 text-lg" style={{ color: hex(palette.navy, 0.88) }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer
            className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border p-5 text-center"
            style={{ borderColor: hex(palette.navy, 0.25), backgroundColor: palette.navy, color: palette.cream }}
          >
            <p className="text-xl" style={{ fontFamily: headingCss }}>
              Con amore, Salvatore & Donatella
            </p>
          </footer>
        </motion.div>
      )}
    </main>
  );
}
