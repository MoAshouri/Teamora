'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import { brandTatil, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import { RemindAtField, saveReminder } from './remind-at';
import './meeting-modal.css';
import './task-modal.css';

export type CalendarTask = {
  id: string;
  title: string;
  description?: string | null;
  dueAt: string | null;
  starred: boolean;
  assigneeId?: string | null;
  assignee?: { id?: string; fullName: string } | null;
};

type Person = { id: string; fullName: string };

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function isoToLocalInput(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dayTimeLocal(isoDay: string, hour: number) {
  return `${isoDay}T${pad(hour)}:00`;
}

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function TaskModal({
  open,
  dayIso,
  task,
  onClose,
  onSaved,
}: {
  open: boolean;
  dayIso: string;
  task: CalendarTask | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const t = useTranslations('app');
  const tCommon = useTranslations('common');
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [starred, setStarred] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [remindAt, setRemindAt] = useState('');
  const [spark, setSpark] = useState(() => brandTatil('gavit', 'light'));

  useEffect(() => {
    const apply = () => setSpark(brandTatil(familyFromDom(), themeFromDom()));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-family'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setConfirmDelete(false);
    setRemindAt('');
    if (task) {
      setTitle(task.title);
      setDueAt(task.dueAt ? isoToLocalInput(task.dueAt) : dayTimeLocal(dayIso, 12));
      setAssigneeId(task.assigneeId ?? task.assignee?.id ?? '');
      setStarred(!!task.starred);
    } else {
      setTitle('');
      setDueAt(dayTimeLocal(dayIso, 12));
      setAssigneeId('');
      setStarred(false);
    }
    api
      .get<{ user: Person }[]>('/users')
      .then((rows) => setPeople(rows.map((row) => row.user)))
      .catch(console.error);
  }, [open, dayIso, task]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const body = {
      title: title.trim(),
      dueAt: new Date(dueAt).toISOString(),
      assigneeId: assigneeId || null,
      starred,
    };
    try {
      const saved = task
        ? await api.patch<CalendarTask>(`/tasks/${task.id}`, body)
        : await api.post<CalendarTask>('/tasks', body);
      await saveReminder({
        targetKind: 'TASK',
        targetId: saved.id,
        title: body.title,
        remindAt,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.newTask'));
    }
  }

  async function onDelete() {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.delete(`/tasks/${task.id}`);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.deleteTask'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? t('calendar.editTask') : t('calendar.newTask')}>
      <form className="meeting-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('calendar.meetingTitle')}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
        </label>
        <label className="field">
          <span>{t('calendar.due')}</span>
          <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t('calendar.assignee')}</span>
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">{t('calendar.unassigned')}</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        </label>
        <button
          className="task-star"
          type="button"
          data-on={starred}
          aria-pressed={starred}
          aria-label={t('calendar.star')}
          onClick={() => setStarred((value) => !value)}
        >
          <img src={spark} alt="" />
        </button>
        <RemindAtField value={remindAt} onChange={setRemindAt} />
        {error ? <p className="meeting-form__error">{error}</p> : null}
        <div className="meeting-form__actions">
          {task ? (
            <button className="btn btn-ghost" type="button" onClick={onDelete}>
              {t('calendar.deleteTask')}
            </button>
          ) : null}
          <button className="btn btn-primary" type="submit">
            {tCommon('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
