'use client';

import { useEffect } from 'react';
import { Modal } from '@/features/ui/modal';
import './day-agenda-modal.css';

export type AgendaPerson = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

export type AgendaRow = {
  id: string;
  time: string;
  title: string;
  people?: AgendaPerson[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '•';
}

export function DayAgendaModal({
  open,
  heading,
  dateLabel,
  empty,
  prevLabel,
  nextLabel,
  rows,
  onPrev,
  onNext,
  onClose,
}: {
  open: boolean;
  heading: string;
  dateLabel: string;
  empty: string;
  prevLabel: string;
  nextLabel: string;
  rows: AgendaRow[];
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onPrev, onNext]);

  return (
    <Modal open={open} onClose={onClose} title={heading}>
      <div className="day-agenda">
        <div className="day-agenda__nav">
          <button className="btn btn-ghost day-agenda__chev" type="button" onClick={onPrev} aria-label={prevLabel}>
            ‹
          </button>
          <p className="day-agenda__date">{dateLabel}</p>
          <button className="btn btn-ghost day-agenda__chev" type="button" onClick={onNext} aria-label={nextLabel}>
            ›
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="muted">{empty}</p>
        ) : (
          <ul className="day-agenda__list">
            {rows.map((row) => (
              <li className="day-agenda__row" key={row.id}>
                <time className="day-agenda__time">{row.time}</time>
                <div>
                  <strong>{row.title}</strong>
                  {row.people?.length ? (
                    <span className="day-agenda__faces">
                      {row.people.map((person) =>
                        person.avatarUrl ? (
                          <img key={person.id} className="day-agenda__face" src={person.avatarUrl} alt={person.fullName} />
                        ) : (
                          <span key={person.id} className="day-agenda__face" title={person.fullName}>
                            {initials(person.fullName)}
                          </span>
                        ),
                      )}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
