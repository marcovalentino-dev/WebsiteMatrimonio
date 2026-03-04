'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { INTRO_SEEN_KEY } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

const INTRO_VIDEO_PATH = '/intro/intro.mp4';

export function IntroGate({
  intro,
  coupleNames,
  children
}: {
  intro: SiteConfig['introLetter'];
  coupleNames: string;
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
      node.muted = false;
      node.currentTime = 0;
      await node.play();
      setNeedsManualStart(false);
    } catch {
      setNeedsManualStart(true);
    }
  };

  const handleEnter = async () => {
    setEntered(true);
    await startVideoWithAudio();
  };

  if (phase === 'checking') return null;

  return (
    <>
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
              <div className="grid h-full w-full place-items-center p-3 sm:p-6">
                <div className="relative h-full w-full max-h-[96vh] max-w-[96vw] overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-contain"
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

                  {!entered && (
                    <div className="absolute inset-0 z-10 overflow-hidden bg-[#120f10]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(155,91,72,0.2),transparent_40%),radial-gradient(circle_at_80%_18%,rgba(180,145,118,0.18),transparent_45%),linear-gradient(180deg,#110f10_0%,#1b1415_100%)]" />
                      <div className="relative z-10 grid min-h-full place-items-center px-6">
                        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm">
                          <p className="text-xs uppercase tracking-[0.35em] text-[#cdafa1]">Welcome</p>
                          <h1 className="mt-4 text-4xl leading-tight text-[#f6e8df] md:text-5xl">{coupleNames}</h1>
                          <p className="mx-auto mt-4 max-w-md text-sm text-[#e2ccc0]">
                            Benvenuti nel nostro invito. Tocca per entrare e iniziare l’esperienza.
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleEnter()}
                            className="mt-8 rounded-2xl border border-[#f3dfd3]/40 bg-[#8f3f3f]/60 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[#fff4ee] transition hover:bg-[#a14a4a]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4ddd0]"
                          >
                            Tap to enter
                          </button>
                        </div>
                      </div>
                    </div>
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
