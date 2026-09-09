'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { samplePath, windowOpacity } from './path';
import { progressStore } from './progress-store';
import { CHAPTERS, WINDOWS, type LandingCopy, type WindowId } from './types';

const LOCALE_LABEL: Record<'en' | 'fa' | 'hy', string> = { en: 'EN', fa: 'فا', hy: 'ՀՀ' };

function Ctas({ locale, copy, primaryOnly = false }: { locale: string; copy: LandingCopy; primaryOnly?: boolean }) {
  return (
    <div className="cta-row landing-ctas">
      <Link className="btn btn-primary landing-btn" href={`/${locale}/login`}>
        {copy.ctaLogin}
      </Link>
      {!primaryOnly ? (
        <>
          <Link className="btn btn-ghost landing-btn" href={`/${locale}/join`}>
            {copy.ctaJoin}
          </Link>
          <Link className="btn btn-ghost landing-btn" href={`/${locale}/login?mode=create`}>
            {copy.ctaRegister}
          </Link>
        </>
      ) : null}
    </div>
  );
}

function LanguageNav({ locale }: { locale: string }) {
  return (
    <nav className="landing-langs" aria-label="Language">
      {(['en', 'fa', 'hy'] as const).map((l) => (
        <Link key={l} href={`/${l}`} hrefLang={l} lang={l} aria-current={l === locale ? 'page' : undefined}>
          {LOCALE_LABEL[l]}
        </Link>
      ))}
    </nav>
  );
}

function Panel({ id, index, children }: { id: WindowId; index: number; children: ReactNode }) {
  return (
    <section
      className="landing-panel"
      data-window={id}
      style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? 'visible' : 'hidden' }}
    >
      <div className="landing-plaque">{children}</div>
    </section>
  );
}

export function LandingOverlay({
  locale,
  copy,
  onJump,
  ready,
}: {
  locale: string;
  copy: LandingCopy;
  onJump: (at: number) => void;
  ready: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  /* Drive panel opacity, chapter dots and the light/dark mood without React re-renders. */
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const panels = Array.from(el.querySelectorAll<HTMLElement>('.landing-panel'));
    const dots = Array.from(el.querySelectorAll<HTMLElement>('.landing-dots button'));
    const hint = el.querySelector<HTMLElement>('.landing-hint');

    return progressStore.subscribe((p) => {
      panels.forEach((panel) => {
        const id = panel.dataset.window as WindowId;
        const [start, end] = WINDOWS[id];
        const o = windowOpacity(p, start, end);
        panel.style.opacity = o.toFixed(3);
        panel.style.visibility = o > 0.02 ? 'visible' : 'hidden';
        panel.style.transform = `translateY(${((1 - o) * 14).toFixed(2)}px)`;
      });

      let active = 0;
      CHAPTERS.forEach((ch, i) => {
        if (p >= ch.at - 0.03) active = i;
      });
      dots.forEach((dot, i) => {
        dot.dataset.active = String(i === active);
      });

      const dark = samplePath(p, false, false).dark;
      el.dataset.mood = dark > 0.42 ? 'dark' : 'light';
      if (hint) hint.style.opacity = p < 0.04 ? '1' : '0';
    });
  }, []);

  return (
    <div className="landing-overlay" ref={root} data-mood="light" data-ready={ready}>
      <a className="landing-skip" href="#landing-end">
        {copy.skip}
      </a>

      <header className="landing-chrome">
        <Link className="landing-brand" href={`/${locale}`} aria-label={copy.brand}>
          <img src="/brand/hayat/hayat-tatil-dark.avif" alt="" width={22} height={22} aria-hidden="true" />
          <span>{copy.brand}</span>
        </Link>
        <div className="landing-chrome-end">
          <LanguageNav locale={locale} />
          <Link className="btn btn-primary landing-btn landing-btn-sm" href={`/${locale}/login`}>
            {copy.ctaLogin}
          </Link>
        </div>
      </header>

      <div className="landing-stage">
        <Panel id="hero" index={0}>
          <p className="landing-kicker">{copy.tagline}</p>
          <h1>{copy.headline}</h1>
          <p className="landing-lede">{copy.sub}</p>
          <Ctas locale={locale} copy={copy} />
        </Panel>

        <Panel id="hours" index={1}>
          <p className="landing-kicker">01</p>
          <h2>{copy.hoursTitle}</h2>
          <p className="landing-lede">{copy.hoursBody}</p>
        </Panel>

        <Panel id="leave" index={2}>
          <p className="landing-kicker">02</p>
          <h2>{copy.leaveTitle}</h2>
          <p className="landing-lede">{copy.leaveBody}</p>
        </Panel>

        <Panel id="calendar" index={3}>
          <p className="landing-kicker">03</p>
          <h2>{copy.calendarTitle}</h2>
          <p className="landing-lede">{copy.calendarBody}</p>
        </Panel>

        <Panel id="company" index={4}>
          <p className="landing-kicker">04</p>
          <h2>{copy.companyTitle}</h2>
          <p className="landing-lede">{copy.companyBody}</p>
        </Panel>

        <Panel id="roles" index={5}>
          <h2>{copy.adminTitle}</h2>
          <p className="landing-lede">{copy.adminBody}</p>
          <h2 className="landing-h2-second">{copy.employeeTitle}</h2>
          <p className="landing-lede">{copy.employeeBody}</p>
        </Panel>

        <Panel id="trust" index={6}>
          <h2>{copy.trustTitle}</h2>
          <p className="landing-lede">{copy.trustBody}</p>
        </Panel>

        <Panel id="seal" index={7}>
          <h2>{copy.sealTitle}</h2>
          <p className="landing-lede">{copy.sealBody}</p>
          <Ctas locale={locale} copy={copy} />
          <LanguageNav locale={locale} />
        </Panel>
      </div>

      <div className="landing-hint" aria-hidden="true">
        <span className="landing-hint-wheel" />
      </div>

      <nav className="landing-progress" aria-label={copy.progressLabel}>
        <ol className="landing-dots">
          {CHAPTERS.map((ch, i) => (
            <li key={ch.id}>
              <button type="button" data-active={i === 0} aria-label={copy[ch.copyKey]} onClick={() => onJump(ch.at)} />
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

/** Same copy, same fonts, no WebGL — used for reduced motion, missing WebGL/AVIF, and crawlers without a GPU. */
export function StaticLanding({ locale, copy }: { locale: string; copy: LandingCopy }) {
  return (
    <article className="landing-static">
      <header className="landing-chrome">
        <Link className="landing-brand" href={`/${locale}`} aria-label={copy.brand}>
          <img src="/brand/hayat/hayat-tatil-dark.avif" alt="" width={22} height={22} aria-hidden="true" />
          <span>{copy.brand}</span>
        </Link>
        <LanguageNav locale={locale} />
      </header>

      <section className="landing-static-hero">
        <div>
          <p className="landing-kicker">{copy.tagline}</p>
          <h1>{copy.headline}</h1>
          <p className="landing-lede">{copy.sub}</p>
          <Ctas locale={locale} copy={copy} />
        </div>
        <figure className="landing-static-figure">
          <img src="/brand/hayat/hayat-gunbad-light.avif" alt="" width={768} height={768} loading="eager" />
          <img className="landing-static-mark" src="/brand/hayat/hayat-wax-light.avif" alt="" width={200} height={205} />
        </figure>
      </section>

      <section className="landing-static-grid">
        {(
          [
            ['hoursTitle', 'hoursBody', '/brand/hayat/hayat-brick-light-terracotta.avif'],
            ['leaveTitle', 'leaveBody', '/brand/hayat/hayat-wax-light.avif'],
            ['calendarTitle', 'calendarBody', '/brand/hayat/hayat-tatil-dark.avif'],
            ['companyTitle', 'companyBody', '/brand/gavit/gavit-gunbad-light.avif'],
          ] as const
        ).map(([title, body, img]) => (
          <div className="landing-static-card" key={title}>
            <img src={img} alt="" width={120} height={80} loading="lazy" />
            <h2>{copy[title]}</h2>
            <p>{copy[body]}</p>
          </div>
        ))}
      </section>

      <section className="landing-static-roles">
        <div className="landing-static-card">
          <img src="/brand/hayat/hayat-gunbad-dark.avif" alt="" width={120} height={120} loading="lazy" />
          <h2>{copy.adminTitle}</h2>
          <p>{copy.adminBody}</p>
        </div>
        <div className="landing-static-card">
          <img src="/brand/hayat/hayat-gunbad-light.avif" alt="" width={120} height={120} loading="lazy" />
          <h2>{copy.employeeTitle}</h2>
          <p>{copy.employeeBody}</p>
        </div>
      </section>

      <section className="landing-static-trust">
        <img src="/brand/gavit/gavit-iwan-dark.avif" alt="" width={120} height={198} loading="lazy" />
        <div>
          <h2>{copy.trustTitle}</h2>
          <p>{copy.trustBody}</p>
        </div>
      </section>

      <section id="landing-end" className="landing-static-seal">
        <img src="/brand/gavit/gavit-wax-light.avif" alt="" width={160} height={162} loading="lazy" />
        <h2>{copy.sealTitle}</h2>
        <p>{copy.sealBody}</p>
        <Ctas locale={locale} copy={copy} />
      </section>
    </article>
  );
}
