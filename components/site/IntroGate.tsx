'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { INTRO_SEEN_KEY } from '@/lib/config/storage';
import { SiteConfig } from '@/lib/config/types';

export function IntroGate({
  intro,
  children
}: {
  intro: SiteConfig['introLetter'];
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<'checking' | 'gate' | 'opening' | 'done'>('checking');

  useEffect(() => {
    if (!intro.enabled) {
      setPhase('done');
      return;
    }
    const seen = window.sessionStorage.getItem(INTRO_SEEN_KEY);
    setPhase(seen ? 'done' : 'gate');
  }, [intro.enabled]);

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('done'), 1500);
    return () => window.clearTimeout(id);
  }, [phase]);

  const envelopeColors = useMemo(() => {
    if (intro.envelopeStyle === 'rose') return { card: '#f5e7e7', flap: '#e9d4d4', text: '#4f2f2f' };
    if (intro.envelopeStyle === 'midnight') return { card: '#243246', flap: '#2f3f55', text: '#eae6dc' };
    return { card: '#f3ebdf', flap: '#e3d5c2', text: '#5b4335' };
  }, [intro.envelopeStyle]);

  if (phase === 'checking') return null;

  return (
    <>
      <AnimatePresence>
        {(phase === 'gate' || phase === 'opening') && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-50 grid place-items-center bg-[#201b1b]/95 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-md text-center">
              <motion.div
                className="relative mx-auto mb-7 aspect-[1.35/1] w-full max-w-[360px]"
                animate={phase === 'opening' ? { y: -20 } : { y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-[68%] rounded-b-2xl"
                  style={{ backgroundColor: envelopeColors.card }}
                  animate={phase === 'opening' ? { scaleY: 0.96 } : { scaleY: 1 }}
                />
                <motion.div
                  className="absolute inset-x-0 top-[19%] h-[46%] origin-top"
                  style={{ backgroundColor: envelopeColors.flap, clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
                  animate={phase === 'opening' ? { rotateX: -170, y: -38 } : { rotateX: 0, y: 0 }}
                  transition={{ duration: intro.animationVariant === 'smooth' ? 0.95 : 0.7 }}
                />
                <motion.div
                  className="absolute left-1/2 top-[28%] z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 text-sm font-semibold"
                  style={{
                    backgroundColor: intro.envelopeStyle === 'midnight' ? '#9f7a5e' : '#9c4f47',
                    borderColor: 'rgba(255,255,255,0.45)',
                    color: '#fff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={phase === 'opening' ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                  onClick={() => {
                    if (phase !== 'gate') return;
                    if (intro.playSound) {
                      const ctx = new AudioContext();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.frequency.value = 680;
                      gain.gain.value = 0.04;
                      osc.start();
                      window.setTimeout(() => {
                        osc.stop();
                        ctx.close();
                      }, 120);
                    }
                    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
                    setPhase('opening');
                  }}
                  role="button"
                  aria-label="Apri invito"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPhase('opening');
                    }
                  }}
                >
                  {intro.sealStyle}
                </motion.div>
                <motion.div
                  className="pointer-events-none absolute inset-x-[8%] top-[18%] z-10 rounded-xl p-5 text-sm shadow-2xl"
                  style={{
                    backgroundColor: '#fffef9',
                    color: envelopeColors.text
                  }}
                  animate={phase === 'opening' ? { y: -88, opacity: 1 } : { y: 18, opacity: 0.95 }}
                  transition={{ duration: 0.85 }}
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.3em]">Wedding Invitation</p>
                  <p>{intro.introText}</p>
                </motion.div>
              </motion.div>
              <p className="text-xs tracking-[0.25em] text-[#e8d8cc]">TAP SEAL TO OPEN</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'done' ? children : null}
    </>
  );
}
