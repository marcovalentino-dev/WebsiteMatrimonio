'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { INTRO_SEEN_KEY } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

const INTRO_VIDEO_PATH = '/intro/intro.mp4';
const SOUNDTRACK_PATH = '/intro/soundtrack.mp3';
const AUDIO_MUTE_AFTER_MS = 60_000;

function formatDate(dateISO: string) {
  const d = new Date(dateISO);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function IntroGate({
  intro,
  coupleNames,
  dateISO,
  children
}: {
  intro: SiteConfig['introLetter'];
  coupleNames: string;
  dateISO: string;
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enteringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<'checking' | 'active' | 'entering' | 'done'>('checking');
  const [entered, setEntered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!intro.enabled) {
      setPhase('done');
      return;
    }
    const seen = window.sessionStorage.getItem(INTRO_SEEN_KEY);
    if (seen) {
      setPhase('done');
    } else {
      setPhase('active');
      setEntered(false);
    }
  }, [intro.enabled]);

  // Auto-transition from entering → done after animation completes
  useEffect(() => {
    if (phase !== 'entering') return;
    enteringTimerRef.current = setTimeout(() => {
      setPhase('done');
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    }, 5000);
    return () => {
      if (enteringTimerRef.current) clearTimeout(enteringTimerRef.current);
    };
  }, [phase]);

  // 60-second auto-mute
  useEffect(() => {
    if (!entered) return;
    muteTimerRef.current = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && !audio.muted) {
        audio.muted = true;
        setIsMuted(true);
      }
    }, AUDIO_MUTE_AFTER_MS);
    return () => {
      if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    };
  }, [entered]);

  const finishIntro = () => {
    // Transition to entering phase (names animation while content loads behind)
    setPhase('entering');
  };

  const startVideoWithAudio = async () => {
    const node = videoRef.current;
    if (!node) return;
    try {
      node.muted = true;
      node.currentTime = 0;
      await node.play();
      setNeedsManualStart(false);
    } catch {
      setNeedsManualStart(true);
    }
  };

  const handleEnter = async () => {
    setEntered(true);
    const soundtrack = audioRef.current;
    if (soundtrack) {
      soundtrack.volume = 0.55;
      void soundtrack.play().catch(() => {});
    }
    await startVideoWithAudio();
  };

  const handleLoadedData = () => {
    const node = videoRef.current;
    if (!node || entered) return;
    node.pause();
    node.currentTime = 0;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Cancel auto-mute timer if user manually toggles
    if (muteTimerRef.current) {
      clearTimeout(muteTimerRef.current);
      muteTimerRef.current = null;
    }
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  if (phase === 'checking') return null;

  return (
    <>
      <audio ref={audioRef} preload="auto" loop>
        <source src={SOUNDTRACK_PATH} type="audio/mpeg" />
      </audio>

      {/* Mute toggle — visible after intro video ends */}
      {(phase === 'entering' || phase === 'done') && entered && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Attiva audio' : 'Silenzia audio'}
          className="fixed right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-opacity hover:bg-black/50"
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
      )}

      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            key="intro-video"
            className="fixed inset-0 z-[100] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {!hasError ? (
              <div className="relative h-full w-full overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="auto"
                  muted
                  controls={false}
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  disablePictureInPicture
                  onLoadedData={handleLoadedData}
                  onEnded={finishIntro}
                  onError={() => setHasError(true)}
                >
                  <source src={INTRO_VIDEO_PATH} type="video/mp4" />
                </video>

                {!entered && (
                  <button
                    type="button"
                    onClick={() => void handleEnter()}
                    className="absolute inset-0 z-10 grid place-items-center bg-black/15"
                    aria-label="Apri invito"
                  >
                    <span className="rounded-full border border-white/45 bg-black/35 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-white sm:text-xs">
                      Tap per aprire
                    </span>
                  </button>
                )}

                {entered && needsManualStart && (
                  <div className="absolute inset-0 grid place-items-center bg-black/45 px-4">
                    <button
                      type="button"
                      onClick={() => void startVideoWithAudio()}
                      className="rounded-2xl border border-white/40 bg-black/40 px-6 py-3 text-sm uppercase tracking-[0.2em] text-white"
                    >
                      Avvia video con audio
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center px-6 text-center text-[#f3e6e1]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c7a79b]">Intro Video</p>
                  <p className="text-sm">
                    File non trovato o non riproducibile:
                    <br />
                    <code>/intro/intro.mp4</code>
                  </p>
                  <button
                    className="rounded-xl border border-white/30 px-4 py-2 text-sm"
                    onClick={finishIntro}
                    type="button"
                  >
                    Continua
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content (entering + done phases) */}
      {(phase === 'entering' || phase === 'done') ? children : null}

      {/* Names reveal overlay — shown during entering phase */}
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
            {/* Decorative line top */}
            <motion.div
              className="mb-6 h-px w-24 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1.2 }}
            />

            {/* Couple names */}
            <motion.h1
              className="text-center font-[var(--font-heading)] text-5xl leading-tight tracking-wide text-white drop-shadow-lg md:text-7xl"
              style={{ fontFamily: 'var(--font-heading), serif' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.6, ease: 'easeOut' }}
            >
              {coupleNames}
            </motion.h1>

            {/* Date */}
            <motion.p
              className="mt-5 text-center text-xl tracking-[0.25em] text-white/75 md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 1.4, ease: 'easeOut' }}
            >
              {formatDate(dateISO)}
            </motion.p>

            {/* Decorative line bottom */}
            <motion.div
              className="mt-6 h-px w-24 bg-white/40"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
