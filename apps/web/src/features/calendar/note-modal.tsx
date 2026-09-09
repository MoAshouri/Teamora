'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import './meeting-modal.css';
import './note-modal.css';

export type CalendarNote = {
  id: string;
  title: string;
  body: string;
  date: string;
};

export function NoteModal({
  open,
  dayIso,
  note,
  onClose,
  onSaved,
}: {
  open: boolean;
  dayIso: string;
  note: CalendarNote | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const t = useTranslations('app');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setConfirmDelete(false);
    setTitle(note?.title ?? '');
    setBody(note?.body ?? '');
  }, [open, note]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError(t('calendar.noteBody'));
      return;
    }
    const payload = { title: title.trim(), body: trimmed, date: note?.date.slice(0, 10) ?? dayIso };
    try {
      if (note) await api.patch(`/notes/${note.id}`, payload);
      else await api.post('/notes', payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.newNote'));
    }
  }

  async function onDelete() {
    if (!note) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.delete(`/notes/${note.id}`);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.deleteMeeting'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={note ? t('calendar.editNote') : t('calendar.newNote')}>
      <form className="meeting-form note-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('calendar.meetingTitle')}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
        </label>
        <label className="field">
          <span>{t('calendar.noteBody')}</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={8000} rows={5} />
        </label>
        {error ? <p className="meeting-form__error">{error}</p> : null}
        <div className="meeting-form__actions">
          {note ? (
            <button className="btn btn-ghost" type="button" onClick={onDelete}>
              {t('calendar.deleteMeeting')}
            </button>
          ) : null}
          <button className="btn btn-primary" type="submit">
            {t('calendar.saveNote')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
