'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { INTRO_SEEN_KEY } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

const INTRO_VIDEO_PATH = '/intro/intro.mp4';

export function IntroGate({
  intro,
  children
}: {
  intro: SiteConfig['introLetter'];
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<'checking' | 'playing' | 'done'>('checking');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!intro.enabled) {
      setPhase('done');
      return;
    }
    const seen = window.sessionStorage.getItem(INTRO_SEEN_KEY);
    setPhase(seen ? 'done' : 'playing');
  }, [intro.enabled]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const node = videoRef.current;
    if (!node) return;

    const playPromise = node.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        setHasError(true);
      });
    }
  }, [phase]);

  const finishIntro = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    setPhase('done');
  };

  if (phase === 'checking') return null;

  return (
    <>
      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            key="intro-video"
            className="fixed inset-0 z-[100] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {!hasError ? (
              <div className="grid h-full w-full place-items-center p-3 sm:p-6">
                <div className="relative h-full w-full max-h-[96vh] max-w-[96vw] overflow-hidden rounded-lg bg-white">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-contain"
                    autoPlay
                    playsInline
                    preload="auto"
                    controls={false}
                    controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                    disablePictureInPicture
                    onEnded={finishIntro}
                    onError={() => setHasError(true)}
                  >
                    <source src={INTRO_VIDEO_PATH} type="video/mp4" />
                  </video>
                </div>
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center px-6 text-center text-[#f3e6e1]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c7a79b]">Intro Video</p>
                  <p className="text-sm">
                    File non trovato o non riproducibile:
                    <br />
                    <code>/public/intro/intro.mp4</code>
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
