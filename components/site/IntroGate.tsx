'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { INTRO_SEEN_KEY } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

const INTRO_VIDEO_PATH = '/intro/intro.mp4';
const SOUNDTRACK_PATH = '/intro/soundtrack.mp3';

export function IntroGate({
  intro,
  coupleNames: _coupleNames,
  children
}: {
  intro: SiteConfig['introLetter'];
  coupleNames: string;
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'checking' | 'active' | 'done'>('checking');
  const [entered, setEntered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);

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

  const finishIntro = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    setPhase('done');
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
      void soundtrack.play().catch(() => {
        // Ignore autoplay errors; user can still continue without music.
      });
    }
    await startVideoWithAudio();
  };

  const handleLoadedData = () => {
    const node = videoRef.current;
    if (!node || entered) return;
    node.pause();
    node.currentTime = 0;
  };

  if (phase === 'checking') return null;

  return (
    <>
      <audio ref={audioRef} preload="auto" loop>
        <source src={SOUNDTRACK_PATH} type="audio/mpeg" />
      </audio>
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
      {phase === 'done' ? children : null}
    </>
  );
}
