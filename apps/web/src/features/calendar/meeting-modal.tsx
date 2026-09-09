'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import { RemindAtField, saveReminder } from './remind-at';
import './meeting-modal.css';

export type CalendarMeeting = {
  id: string;
  title: string;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  attendees?: Array<{ userId?: string; user: { id: string; fullName: string } }>;
};

type Person = { id: string; fullName: string };
type LeaveRow = {
  status: string;
  startDate: string;
  endDate: string;
  user: { id: string; fullName: string };
};

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

function overlappingLeave(leave: LeaveRow, startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const leaveStart = new Date(`${leave.startDate.slice(0, 10)}T00:00:00.000Z`);
  const leaveEnd = new Date(`${leave.endDate.slice(0, 10)}T23:59:59.999Z`);
  return leave.status === 'APPROVED' && start <= leaveEnd && end >= leaveStart;
}

export function MeetingModal({
  open,
  dayIso,
  meeting,
  onClose,
  onSaved,
}: {
  open: boolean;
  dayIso: string;
  meeting: CalendarMeeting | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const t = useTranslations('app');
  const tCommon = useTranslations('common');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [conflict, setConflict] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [remindAt, setRemindAt] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setConflict('');
    setConfirmDelete(false);
    setRemindAt('');
    if (meeting) {
      setTitle(meeting.title);
      setLocation(meeting.location ?? '');
      setStartsAt(isoToLocalInput(meeting.startsAt));
      setEndsAt(isoToLocalInput(meeting.endsAt));
      setAttendeeIds(
        meeting.attendees?.map((row) => row.user?.id ?? row.userId).filter(Boolean) as string[],
      );
    } else {
      setTitle('');
      setLocation('');
      setStartsAt(dayTimeLocal(dayIso, 9));
      setEndsAt(dayTimeLocal(dayIso, 10));
      setAttendeeIds([]);
    }
    api
      .get<{ user: Person }[]>('/users')
      .then((rows) => setPeople(rows.map((row) => row.user)))
      .catch(console.error);
  }, [open, dayIso, meeting]);

  useEffect(() => {
    if (!open || !startsAt || !endsAt || attendeeIds.length === 0) {
      setConflict('');
      return;
    }
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();
    const from = startIso.slice(0, 10);
    const to = endIso.slice(0, 10);
    api
      .get<LeaveRow[]>(`/leaves?from=${from}&to=${to}`)
      .then((rows) => {
        const hit = rows.find(
          (row) => attendeeIds.includes(row.user.id) && overlappingLeave(row, startIso, endIso),
        );
        setConflict(hit ? t('calendar.leaveConflict', { name: hit.user.fullName }) : '');
      })
      .catch(() => setConflict(''));
  }, [open, startsAt, endsAt, attendeeIds, t]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();
    const body = {
      title: title.trim(),
      location: location.trim() || undefined,
      startsAt: startIso,
      endsAt: endIso,
      attendeeIds,
    };
    try {
      const saved = meeting
        ? await api.patch<CalendarMeeting>(`/calendar/events/${meeting.id}`, body)
        : await api.post<CalendarMeeting>('/calendar/events', body);
      await saveReminder({
        targetKind: 'MEETING',
        targetId: saved.id,
        title: body.title,
        remindAt,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.newMeeting'));
    }
  }

  async function onDelete() {
    if (!meeting) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.delete(`/calendar/events/${meeting.id}`);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.deleteMeeting'));
    }
  }

  function togglePerson(id: string) {
    setAttendeeIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meeting ? t('calendar.editMeeting') : t('calendar.newMeeting')}
    >
      <form className="meeting-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('calendar.meetingTitle')}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
        </label>
        <label className="field">
          <span>{t('calendar.location')}</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={200} />
        </label>
        <label className="field">
          <span>{t('calendar.start')}</span>
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t('calendar.end')}</span>
          <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required />
        </label>
        <fieldset className="field">
          <legend>{t('calendar.attendees')}</legend>
          <div className="meeting-form__people">
            {people.map((person) => (
              <label className="meeting-form__person" key={person.id}>
                <input
                  type="checkbox"
                  checked={attendeeIds.includes(person.id)}
                  onChange={() => togglePerson(person.id)}
                />
                {person.fullName}
              </label>
            ))}
          </div>
        </fieldset>
        {conflict ? <p className="meeting-form__warn">{conflict}</p> : null}
        <RemindAtField value={remindAt} onChange={setRemindAt} />
        {error ? <p className="meeting-form__error">{error}</p> : null}
        <div className="meeting-form__actions">
          {meeting ? (
            <button className="btn btn-ghost" type="button" onClick={onDelete}>
              {t('calendar.deleteMeeting')}
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
