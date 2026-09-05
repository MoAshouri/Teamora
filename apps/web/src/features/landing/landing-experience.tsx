'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { LandingOverlay, StaticLanding } from './landing-overlay';
import { samplePath } from './path';
import { progressStore } from './progress-store';
import { STORY_HEIGHT_VH, type LandingCopy } from './types';
import './landing.css';

const LandingCanvas = dynamic(() => import('./landing-canvas').then((m) => m.LandingCanvas), { ssr: false });

type Mode = 'pending' | 'story' | 'static';

/** Decode one small brand AVIF: proves the browser can show the kit and warms the cache for the loader mark. */
function probeAvif() {
  const img = new Image();
  img.src = '/brand/hayat/hayat-tatil-dark.avif';
  return img
    .decode()
    .then(() => img.naturalWidth > 0)
    .catch(() => false);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Decide once whether this device gets the WebGL story or the static page. */
function useLandingMode() {
  const [mode, setMode] = useState<Mode>('pending');
  useEffect(() => {
    let alive = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !hasWebGL()) {
      setMode('static');
      return undefined;
    }
    probeAvif().then((ok) => {
      if (alive) setMode(ok ? 'story' : 'static');
    });
    return () => {
      alive = false;
    };
  }, []);
  return mode;
}

function useViewportFlags() {
  const [compact, setCompact] = useState(false);
  const [lowGpu, setLowGpu] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 839px)');
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    setLowGpu((typeof mem === 'number' && mem <= 4) || cores <= 4 || mq.matches);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return { compact, lowGpu };
}

export function LandingExperience({ locale, rtl, copy }: { locale: string; rtl: boolean; copy: LandingCopy }) {
  const mode = useLandingMode();
  const { compact, lowGpu } = useViewportFlags();
  const [ready, setReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  /* Smooth scroll → single progress value. Nothing here touches React state. */
  useEffect(() => {
    if (mode !== 'story') return undefined;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const trigger = ScrollTrigger.create({
      trigger: '.landing-track',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => progressStore.set(self.progress),
    });

    const unsubscribe = progressStore.subscribe((p) => {
      if (veilRef.current) veilRef.current.style.opacity = samplePath(p, rtl, compact).fade.toFixed(3);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.target instanceof HTMLInputElement) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const page = window.innerHeight * 0.9;
      const map: Record<string, number | undefined> = {
        PageDown: Math.min(max, window.scrollY + page),
        PageUp: Math.max(0, window.scrollY - page),
        Home: 0,
        End: max,
      };
      const to = map[e.key];
      if (to !== undefined) {
        e.preventDefault();
        lenis.scrollTo(to);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      unsubscribe();
      trigger.kill();
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [mode, rtl, compact]);

  const jump = useCallback((at: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const top = at * max;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.4 });
    else window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  if (mode === 'static') {
    return (
      <main className="landing-root" data-mode="static">
        <StaticLanding locale={locale} copy={copy} />
      </main>
    );
  }

  return (
    <main className="landing-root" data-mode={mode}>
      <div className="landing-track" aria-hidden="true" style={{ height: `${STORY_HEIGHT_VH}vh` }} />
      {mode === 'story' ? (
        <LandingCanvas rtl={rtl} compact={compact} lowGpu={lowGpu} ready={ready} onReady={onReady} />
      ) : null}
      <div className="landing-grain" aria-hidden="true" />
      <div className="landing-vignette" aria-hidden="true" />
      <div className="landing-veil" ref={veilRef} aria-hidden="true" />
      <LandingOverlay locale={locale} copy={copy} onJump={jump} ready={ready} />
      {/* Copy paints first (LCP); the world fades in behind it. This is only a small "still loading" mark. */}
      <div className="landing-loading" data-hidden={ready} aria-hidden="true">
        <img src="/brand/hayat/hayat-tatil-dark.avif" alt="" width={28} height={28} />
      </div>
      <div id="landing-end" hidden />
    </main>
  );
}
