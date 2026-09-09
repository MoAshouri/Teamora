'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import './modal.css';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusables = () =>
      panel
        ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
            (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
          )
        : [];

    const items = focusables();
    (items[0] ?? panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop modal-backdrop"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={panelRef}
        className="card modal-panel ui-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="ui-modal-title" id={titleId}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}