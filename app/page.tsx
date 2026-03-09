'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type CompanionType = 'Parente' | 'Bambino';
type Companion     = { name: string; type: CompanionType };
type Palette       = { steel: string; navy: string; cream: string; peach: string };
type FontKey       = 'lucida-handwriting' | 'segoe-script' | 'lucida-calligraphy';
type Phase         = 'idle' | 'ready' | 'playing' | 'entering' | 'done';
type View          = 'home' | 'rsvp' | 'info';

// ─── Constants ────────────────────────────────────────────────────────────────
const INTRO_VIDEO = '/intro/intro.mp4';
const SOUNDTRACK  = '/intro/soundtrack.mp3';
const MUTE_AFTER  = 60_000;
const VIEW_IDX: Record<View, number> = { home: 0, rsvp: 1, info: 2 };

const DEFAULT_PALETTE: Palette = {
  steel: '#6e88a0',
  navy:  '#2b4257',
  cream: '#f9dcca',
  peach: '#ecc4a8',
};

const FONTS: { id: FontKey; label: string; css: string }[] = [
  { id: 'lucida-handwriting', label: 'Lucida Handwriting', css: '"Lucida Handwriting", cursive' },
  { id: 'segoe-script',       label: 'Segoe Script',       css: '"Segoe Script", cursive' },
  { id: 'lucida-calligraphy', label: 'Lucida Calligraphy', css: '"Lucida Calligraphy", cursive' },
];

// ─── Wedding content ──────────────────────────────────────────────────────────
const C = {
  names:     'Salvatore\n & \n Donatella',
  shortDate: '30.09.2026',
  ceremony: {
    name:        'Chiesa di Santa Lucia Vergine al Monte',
    time:        '11.15',
    fullAddress: 'Corso Vittorio Emanuele, 328 — 80135 Napoli',
    mapsQ:       'Chiesa di Santa Lucia Vergine al Monte, Corso Vittorio Emanuele 328, Napoli',
  },
  reception: {
    name:        'Hotel San Francesco al Monte',
    description: "Dopo la celebrazione, il ricevimento si terrà a pochi passi dalla Chiesa, presso l'Hotel San Francesco al Monte, un antico monastero affacciato sul Golfo.",
    fullAddress: 'Corso Vittorio Emanuele, 328 — 80135 Napoli',
    parkingNote: 'Il Corso Vittorio Emanuele è particolarmente panoramico: vi consigliamo di arrivare con qualche minuto di anticipo per goderlo e facilitare il parcheggio.',
    mapsQ:       'Hotel San Francesco al Monte, Corso Vittorio Emanuele 328, Napoli',
  },
  deadline: '1 agosto 2026',
  faq: [
    {
      q: 'Entro quando devo confermare la presenza?',
      a: 'Siamo lieti di ricevere la vostra conferma entro il 1 agosto 2026, così potremo organizzare al meglio la giornata.',
    },
    {
      q: 'Posso portare familiari o bambini?',
      a: 'Certo, i bambini sono i benvenuti. Nel modulo di conferma potete aggiungere tutti gli accompagnatori.',
    },
    {
      q: "Come raggiungo la chiesa e l'hotel?",
      a: "Nella sezione Mappe trovate le indicazioni precise. La chiesa e l'hotel si trovano entrambi sul Corso Vittorio Emanuele — a brevissima distanza l'uno dall'altro.",
    },
    {
      q: "C'è un codice di abbigliamento?",
      a: 'Abito elegante. Per qualsiasi dubbio, scriveteci: saremo felici di aiutarvi.',
    },
  ],
} as const;

// ─── Utilities ────────────────────────────────────────────────────────────────
const mapUrl = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

function rgba(color: string, a: number): string {
  const n = color.replace('#', '');
  const f = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const v = parseInt(f, 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconChurch({ size = 44, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4v10M20 9h8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 44V26c0-8 5-12 14-12s14 4 14 12v18" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 44h36" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 28h28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M19 44v-9c0-3 2-5 5-5s5 2 5 5v9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconReception({ size = 44, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 44h36M10 44V20L24 8l14 12v24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="28" width="12" height="16" rx="2" stroke={color} strokeWidth="2" />
      <rect x="12" y="22" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <rect x="30" y="22" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function IconCalendar({ size = 44, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="12" width="36" height="30" rx="4" stroke={color} strokeWidth="2.5" />
      <path d="M6 22h36M16 8v8M32 8v8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="32" r="2" fill={color} />
      <circle cx="24" cy="32" r="2" fill={color} />
      <circle cx="30" cy="32" r="2" fill={color} />
      <circle cx="18" cy="38" r="2" fill={color} />
      <circle cx="24" cy="38" r="2" fill={color} />
    </svg>
  );
}

function IconSound({ active }: { active: boolean }) {
  return active ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

// ─── Slide transition ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0 }),
  show:  { y: '0%', opacity: 1 },
  exit:  (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0 }),
};
const slideEase = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const muteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase]               = useState<Phase>('idle');
  const [introError, setIntroError]     = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [view, setView]                 = useState<View>('home');
  const [dir, setDir]                   = useState(1);
  const [palette, setPalette]           = useState<Palette>(DEFAULT_PALETTE);
  const [font, setFont]                 = useState<FontKey>('lucida-handwriting');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // RSVP form
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [allergies, setAllergies] = useState('');
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isSending, setIsSending]   = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');

  const totalGuests = useMemo(
    () => 1 + companions.filter((c) => c.name.trim().length > 0).length,
    [companions],
  );

  useEffect(() => { setPhase('ready'); }, []);

  useEffect(() => {
    if (phase !== 'entering') return;
    const t = setTimeout(() => setPhase('done'), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!audioStarted) return;
    muteTimer.current = setTimeout(() => {
      const a = audioRef.current;
      if (a && !a.muted) { a.muted = true; setIsMuted(true); }
    }, MUTE_AFTER);
    return () => { if (muteTimer.current) clearTimeout(muteTimer.current); };
  }, [audioStarted]);

  const startIntro = async () => {
    setAudioStarted(true);
    const a = audioRef.current;
    if (a) { a.volume = 0.55; void a.play().catch(() => {}); }
    const v = videoRef.current;
    if (!v) { setPhase('entering'); return; }
    try {
      v.muted = true; v.currentTime = 0;
      await v.play();
      setPhase('playing');
    } catch {
      setIntroError(true);
      setPhase('entering');
    }
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    if (muteTimer.current) { clearTimeout(muteTimer.current); muteTimer.current = null; }
    a.muted = !a.muted;
    setIsMuted(a.muted);
  };

  const navigate = useCallback((to: View) => {
    setDir(VIEW_IDX[to] >= VIEW_IDX[view] ? 1 : -1);
    setView(to);
    setSettingsOpen(false);
  }, [view]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMsg('');
    const clean = companions.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name.length > 0);
    if (!firstName.trim() || !lastName.trim()) { setSubmitMsg('Inserisci nome e cognome per continuare.'); return; }
    setIsSending(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), allergies: allergies.trim(), companions: clean }),
      });
      const payload = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !payload.ok) { setSubmitMsg(payload.message ?? 'Si è verificato un problema. Riprova.'); return; }
      setSubmitMsg('Conferma ricevuta. Grazie mille!');
      setFirstName(''); setLastName(''); setAllergies(''); setCompanions([]);
    } catch {
      setSubmitMsg('Connessione non disponibile. Riprova tra qualche minuto.');
    } finally {
      setIsSending(false);
    }
  };

  if (phase === 'idle') return null;

  // ─── Derived styles ───────────────────────────────────────────────────────
  const hFont = FONTS.find((f) => f.id === font)?.css ?? FONTS[0].css;
  const block: CSSProperties = {
    borderColor:     rgba(palette.navy, 0.18),
    backgroundColor: rgba(palette.cream, 0.93),
    boxShadow:       `0 12px 40px ${rgba(palette.navy, 0.13)}`,
  };
  const card: CSSProperties = {
    borderColor:     rgba(palette.navy, 0.13),
    backgroundColor: rgba('#ffffff', 0.78),
  };
  const inp: CSSProperties = {
    borderColor:     rgba(palette.navy, 0.28),
    color:           palette.navy,
    backgroundColor: rgba('#ffffff', 0.88),
  };

  // ─── Shared UI helpers ────────────────────────────────────────────────────
  const backBtn = (label = '← Torna all\'inizio') => (
    <button
      type="button"
      onClick={() => navigate('home')}
      className="mb-6 flex items-center gap-1 text-sm font-semibold transition hover:opacity-70"
      style={{ color: rgba(palette.navy, 0.65) }}
    >
      {label}
    </button>
  );

  const sectionTitle = (text: string) => (
    <h2 className="mb-5 text-center text-3xl md:text-4xl" style={{ color: palette.navy, fontFamily: hFont }}>
      {text}
    </h2>
  );

  const wrap = (id: string | undefined, children: React.ReactNode) => (
    <div id={id} className="mx-auto w-full max-w-3xl rounded-2xl border p-6 md:p-8" style={block}>
      {children}
    </div>
  );

  // ─── HOME VIEW ────────────────────────────────────────────────────────────
  const homeView = () => (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 text-center">
      {/* Names + date */}
      <div className="mb-0">
        <div className="mx-auto mb-5 h-px w-20" style={{ backgroundColor: rgba(palette.cream, 0.45) }} />
        <h1 className="text-5xl leading-tight md:text-7xl" style={{ fontFamily: hFont, color: palette.cream }}>
          {C.names}
        </h1>
        <p className="mt-3 text-xl" style={{ color: rgba(palette.cream, 0.72) }}>
          {C.shortDate}
        </p>
        <div className="mx-auto mt-5 h-px w-20" style={{ backgroundColor: rgba(palette.cream, 0.45) }} />
      </div>

      {/* Invitation text */}
      <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed md:text-lg" style={{ color: rgba(palette.cream, 0.88) }}>
        <strong>Mercoledì 30 settembre 2026</strong> scriveremo un nuovo capitolo della nostra storia d'amore
        e saremmo onorati di avervi al nostro fianco. Consultate le informazioni e fateci sapere se sarete dei nostri.
      </p>

      {/* Summary cards */}
      <div className="mt-8 grid w-full max-w-3xl gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl border p-5 text-center" style={block}>
          <IconChurch size={40} color={palette.steel} />
          <p className="mt-3 text-sm font-semibold" style={{ color: palette.steel }}>La Cerimonia</p>
          <p className="mt-1 text-base font-semibold leading-tight" style={{ color: palette.navy, fontFamily: hFont }}>
            {C.ceremony.name}
          </p>
          <p className="mt-2 text-sm" style={{ color: rgba(palette.navy, 0.8) }}>
            Ore <strong>{C.ceremony.time}</strong>
          </p>
          <p className="text-sm" style={{ color: rgba(palette.navy, 0.65) }}>Napoli</p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border p-5 text-center" style={block}>
          <IconReception size={40} color={palette.steel} />
          <p className="mt-3 text-sm font-semibold" style={{ color: palette.steel }}>Il Ricevimento</p>
          <p className="mt-1 text-base font-semibold leading-tight" style={{ color: palette.navy, fontFamily: hFont }}>
            {C.reception.name}
          </p>
          <p className="mt-2 text-sm" style={{ color: rgba(palette.navy, 0.8) }}>
            A pochi passi dalla chiesa
          </p>
          <p className="text-sm" style={{ color: rgba(palette.navy, 0.65) }}>Napoli</p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border p-5 text-center" style={block}>
          <IconCalendar size={40} color={palette.steel} />
          <p className="mt-3 text-sm font-semibold" style={{ color: palette.steel }}>Conferma presenza</p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: rgba(palette.navy, 0.8) }}>
            Vi chiediamo gentilmente di farci sapere entro il
          </p>
          <p className="mt-1 text-lg font-bold" style={{ color: palette.navy }}>
            {C.deadline}
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('rsvp')}
          className="rounded-2xl px-8 py-4 text-base font-semibold transition hover:opacity-90"
          style={{ backgroundColor: palette.navy, color: palette.cream }}
        >
          Conferma la tua presenza
        </button>
        <button
          type="button"
          onClick={() => navigate('info')}
          className="rounded-2xl border px-8 py-4 text-base font-semibold backdrop-blur-sm transition hover:opacity-80"
          style={{ borderColor: rgba(palette.cream, 0.55), color: palette.cream }}
        >
          Maggiori informazioni
        </button>
      </div>
    </div>
  );

  // ─── RSVP VIEW ────────────────────────────────────────────────────────────
  const rsvpView = () => (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {backBtn()}
        {wrap(undefined, <>
          {sectionTitle('Conferma la tua presenza')}
          <p className="text-center text-base leading-relaxed" style={{ color: rgba(palette.navy, 0.78) }}>
            Sarà un onore avervi con noi. Vi chiediamo di compilare questo modulo
            entro il <strong>{C.deadline}</strong>.
            <br />
            Se venite con familiari o bambini, aggiungeteli qui sotto.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold" htmlFor="fn" style={{ color: palette.navy }}>Nome</label>
                <input id="fn" className="w-full rounded-xl border px-4 py-3 text-base" style={inp} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold" htmlFor="ln" style={{ color: palette.navy }}>Cognome</label>
                <input id="ln" className="w-full rounded-xl border px-4 py-3 text-base" style={inp} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="al" style={{ color: palette.navy }}>
                Intolleranze o allergie alimentari
              </label>
              <textarea
                id="al"
                className="min-h-20 w-full rounded-xl border px-4 py-3 text-base"
                style={inp}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Se non presenti, scrivete: Nessuna"
              />
            </div>

            <div className="rounded-xl border p-4" style={card}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold" style={{ color: palette.navy, fontFamily: hFont }}>
                  Accompagnatori
                </h3>
                <button
                  type="button"
                  onClick={() => setCompanions((p) => [...p, { name: '', type: 'Parente' }])}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: palette.navy }}
                >
                  Aggiungi persona
                </button>
              </div>
              {companions.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: rgba(palette.navy, 0.65) }}>
                  Nessun accompagnatore aggiunto.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {companions.map((c, i) => (
                    <div key={i} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_160px_auto]" style={card}>
                      <input
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={inp}
                        placeholder="Nome e cognome"
                        value={c.name}
                        onChange={(e) => setCompanions((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      />
                      <select
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={inp}
                        value={c.type}
                        onChange={(e) => setCompanions((p) => p.map((x, j) => j === i ? { ...x, type: e.target.value as CompanionType } : x))}
                      >
                        <option value="Parente">Parente</option>
                        <option value="Bambino">Bambino</option>
                      </select>
                      <button
                        type="button"
                        className="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:opacity-70"
                        style={{ borderColor: rgba(palette.navy, 0.28), color: palette.navy }}
                        onClick={() => setCompanions((p) => p.filter((_, j) => j !== i))}
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm" style={{ color: palette.navy }}>
              Totale persone confermate: <strong>{totalGuests}</strong>
            </p>

            <button
              type="submit"
              disabled={isSending}
              className="w-full rounded-xl px-6 py-4 text-base font-semibold text-white transition disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: palette.steel, opacity: isSending ? 0.7 : 1 }}
            >
              {isSending ? 'Invio in corso…' : 'Invia la conferma'}
            </button>

            {submitMsg && (
              <p className="text-center text-base font-semibold" style={{ color: palette.navy }}>{submitMsg}</p>
            )}
          </form>
        </>)}
      </div>
    </div>
  );

  // ─── INFO VIEW ────────────────────────────────────────────────────────────
  const infoView = () => (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        {backBtn()}

        {/* Programma */}
        {wrap('programma', <>
          {sectionTitle('Il Programma della Giornata')}
          <div className="space-y-4">
            <div className="rounded-xl border p-5" style={card}>
              <p className="text-sm font-semibold" style={{ color: palette.steel }}>La Cerimonia</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: palette.navy, fontFamily: hFont }}>
                {C.ceremony.name}
              </p>
              <p className="mt-2 text-base" style={{ color: rgba(palette.navy, 0.85) }}>
                Orario: <strong>ore {C.ceremony.time}</strong>
              </p>
              <p className="mt-1 text-base font-semibold" style={{ color: rgba(palette.navy, 0.75) }}>
                {C.ceremony.fullAddress}
              </p>
            </div>

            <div className="mx-auto h-px w-full" style={{ backgroundColor: rgba(palette.navy, 0.08) }} />

            <div className="rounded-xl border p-5" style={card}>
              <p className="text-sm font-semibold" style={{ color: palette.steel }}>Il Ricevimento</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: palette.navy, fontFamily: hFont }}>
                {C.reception.name}
              </p>
              <p className="mt-2 text-base leading-relaxed" style={{ color: rgba(palette.navy, 0.85) }}>
                {C.reception.description}
              </p>
              <p className="mt-2 text-base font-semibold" style={{ color: rgba(palette.navy, 0.75) }}>
                {C.reception.fullAddress}
              </p>
              <p className="mt-3 text-sm" style={{ color: rgba(palette.navy, 0.65) }}>
                {C.reception.parkingNote}
              </p>
            </div>
          </div>
        </>)}

        {/* Mappe */}
        {wrap('mappe', <>
          {sectionTitle('Mappe e Indicazioni')}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-base font-semibold" style={{ color: palette.navy }}>Chiesa</p>
              <iframe
                title="Mappa Chiesa"
                src={mapUrl(C.ceremony.mapsQ)}
                className="h-[240px] w-full rounded-xl border"
                style={{ borderColor: rgba(palette.navy, 0.16) }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div>
              <p className="mb-2 text-base font-semibold" style={{ color: palette.navy }}>Hotel</p>
              <iframe
                title="Mappa Hotel"
                src={mapUrl(C.reception.mapsQ)}
                className="h-[240px] w-full rounded-xl border"
                style={{ borderColor: rgba(palette.navy, 0.16) }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </>)}

        {/* Domande frequenti */}
        {wrap('faq', <>
          {sectionTitle('Hai delle domande?')}
          <p className="mb-5 text-center text-base" style={{ color: rgba(palette.navy, 0.68) }}>
            Ecco le risposte alle domande più frequenti.
          </p>
          <div className="space-y-3">
            {C.faq.map((item) => (
              <details key={item.q} className="rounded-xl border p-4" style={card}>
                <summary className="cursor-pointer text-base font-semibold" style={{ color: palette.navy }}>
                  {item.q}
                </summary>
                <p className="mt-3 text-base leading-relaxed" style={{ color: rgba(palette.navy, 0.82) }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </>)}

        {/* Footer */}
        <div
          className="rounded-2xl border p-5 text-center"
          style={{ borderColor: rgba(palette.navy, 0.22), backgroundColor: palette.navy, color: palette.cream }}
        >
          <p className="text-xl" style={{ fontFamily: hFont }}>Con amore, Salvatore & Donatella</p>
        </div>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="relative" style={{ fontFamily: hFont }}>
      <audio ref={audioRef} preload="auto" loop>
        <source src={SOUNDTRACK} type="audio/mpeg" />
      </audio>

      {/* ── Intro video overlay ─────────────────────────────────────────── */}
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
                  ref={videoRef}
                  className="h-full w-full object-contain"
                  playsInline preload="auto" muted
                  onEnded={() => setPhase('entering')}
                  onError={() => { setIntroError(true); setPhase('entering'); }}
                >
                  <source src={INTRO_VIDEO} type="video/mp4" />
                </video>
                {phase === 'ready' && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => void startIntro()}
                    onKeyDown={(e) => e.key === 'Enter' && void startIntro()}
                    className="absolute inset-0 cursor-pointer bg-black/20"
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <button
                  type="button"
                  onClick={() => void startIntro()}
                  className="rounded-xl border border-white/45 bg-black/40 px-6 py-3 text-sm font-semibold text-white"
                >
                  Continua al sito
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background video + gradient ─────────────────────────────────── */}
      {(phase === 'entering' || phase === 'done') && (
        <>
          <video className="fixed inset-0 h-full w-full object-cover" autoPlay muted loop playsInline>
            <source src="/background.mp4" type="video/mp4" />
          </video>
          <div
            className="fixed inset-0"
            style={{
              background: `linear-gradient(160deg, ${rgba(palette.navy, 0.74)} 0%, ${rgba(palette.navy, 0.52)} 50%, ${rgba(palette.navy, 0.66)} 100%)`,
            }}
          />
        </>
      )}

      {/* ── Names animation ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'entering' && (
          <motion.div
            key="names"
            className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/50 px-6"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          >
            <motion.div
              className="mx-auto mb-5 h-px w-20 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1.2 }}
            />
            <motion.h1
              className="whitespace-pre-line text-center text-5xl leading-tight text-white drop-shadow-xl md:text-7xl"
              style={{ fontFamily: hFont }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
            >
              {C.names}
            </motion.h1>
            <motion.p
              className="mt-4 text-center text-xl tracking-[0.2em] text-white/70 md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1.3, ease: 'easeOut' }}
            >
              {C.shortDate}
            </motion.p>
            <motion.div
              className="mx-auto mt-5 h-px w-20 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mute toggle ─────────────────────────────────────────────────── */}
      {audioStarted && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Attiva audio' : 'Silenzia audio'}
          className="fixed left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          <IconSound active={!isMuted} />
        </button>
      )}

      {/* ── Settings button ─────────────────────────────────────────────── */}
      {phase === 'done' && (
        <button
          type="button"
          onClick={() => setSettingsOpen((p) => !p)}
          className="fixed right-3 top-3 z-[90] rounded-xl border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition"
          style={{ borderColor: rgba(palette.navy, 0.3), backgroundColor: rgba(palette.cream, 0.94), color: palette.navy }}
        >
          {settingsOpen ? 'Chiudi' : '⚙ Impostazioni'}
        </button>
      )}

      {/* ── Settings panel ──────────────────────────────────────────────── */}
      {settingsOpen && phase === 'done' && (
        <aside
          className="fixed right-3 top-14 z-[80] max-h-[80vh] w-[290px] overflow-y-auto rounded-2xl border p-4 backdrop-blur-sm"
          style={{ borderColor: rgba(palette.navy, 0.18), backgroundColor: rgba(palette.cream, 0.97), boxShadow: `0 12px 40px ${rgba(palette.navy, 0.16)}` }}
        >
          <p className="text-xs font-semibold" style={{ color: palette.steel }}>PALETTE</p>
          <div className="mt-2 space-y-2">
            {(['steel', 'navy', 'cream', 'peach'] as const).map((k) => (
              <label key={k} className="grid grid-cols-[56px_36px_1fr] items-center gap-2 text-sm" style={{ color: palette.navy }}>
                <span className="font-semibold capitalize">{k}</span>
                <input type="color" value={palette[k]} onChange={(e) => setPalette((p) => ({ ...p, [k]: e.target.value }))} className="h-7 w-full cursor-pointer rounded border-0 p-0" />
                <span className="rounded border px-2 py-1 text-xs font-mono" style={inp}>{palette[k]}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setPalette(DEFAULT_PALETTE)}
              className="mt-1 w-full rounded-xl border py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: rgba(palette.navy, 0.28), color: palette.navy }}
            >
              Ripristina palette
            </button>
          </div>

          <p className="mt-4 text-xs font-semibold" style={{ color: palette.steel }}>FONT</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {FONTS.map(({ id, label, css }) => {
              const on = font === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFont(id)}
                  className="flex flex-col items-center gap-1 rounded-xl border py-3 text-center transition-all"
                  style={{
                    borderColor:     on ? palette.navy : rgba(palette.navy, 0.15),
                    backgroundColor: on ? palette.navy : rgba('#ffffff', 0.72),
                    color:           on ? palette.cream : palette.navy,
                  }}
                >
                  <span style={{ fontFamily: css }} className="text-2xl leading-none">Aa</span>
                  <span className="text-[9px] leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* ── Carousel ────────────────────────────────────────────────────── */}
      {(phase === 'entering' || phase === 'done') && (
        <motion.div
          className="fixed inset-0 z-10 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'done' ? 1 : 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <AnimatePresence custom={dir} mode="sync">
            {view === 'home' && (
              <motion.div
                key="home"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="show"
                exit="exit"
                transition={slideEase}
                className="absolute inset-0 overflow-y-auto"
              >
                {homeView()}
              </motion.div>
            )}
            {view === 'rsvp' && (
              <motion.div
                key="rsvp"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="show"
                exit="exit"
                transition={slideEase}
                className="absolute inset-0 overflow-y-auto"
              >
                {rsvpView()}
              </motion.div>
            )}
            {view === 'info' && (
              <motion.div
                key="info"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="show"
                exit="exit"
                transition={slideEase}
                className="absolute inset-0 overflow-y-auto"
              >
                {infoView()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}
