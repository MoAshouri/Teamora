'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { GunbadDay } from '@/features/ui/gunbad-day';
import { Modal } from '@/features/ui/modal';
import { MeetingModal, meetingConflictLabel, type CalendarMeeting } from './meeting-modal';
import { TaskModal, type CalendarTask } from './task-modal';
import { NoteModal, type CalendarNote } from './note-modal';
import { LeavePreview, overlayLeaves, leaveOnDay, type CalendarLeave } from './leave-chip';
import {
  calendarYearMonth,
  formatMonthTitle,
  formatWeekdayShort,
  getMonthGrid,
  dateKeyInZone,
  isoDateUtc,
  todayKeyInZone,
  overlapsZonedYmd,
  utcInstantRangeForYmd,
  shiftCalendarMonth,
} from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './month-grid.css';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

type Holiday = {
  id: string;
  name: string;
  nameFa?: string | null;
  date: string;
};

function eventIso(value: string, timeZone = 'UTC') {
  return dateKeyInZone(value, timeZone);
}

export function CalendarMonthGrid() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarMeeting[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_WORK_DAYS);
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [draft, setDraft] = useState<{ dayIso: string; meeting: CalendarMeeting | null } | null>(null);
  const [taskDraft, setTaskDraft] = useState<{ dayIso: string; task: CalendarTask | null } | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ dayIso: string; note: CalendarNote | null } | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [leaves, setLeaves] = useState<CalendarLeave[]>([]);
  const [leaveDraft, setLeaveDraft] = useState<CalendarLeave | null>(null);
  const [composer, setComposer] = useState<string | null>(null);

  const { year, month } = useMemo(() => calendarYearMonth(anchor, locale), [anchor, locale]);
  const cells = useMemo(() => getMonthGrid(locale, year, month), [locale, year, month]);
  const title = useMemo(() => formatMonthTitle(anchor, locale), [anchor, locale]);
  const weekdayLabels = useMemo(() => {
    const first = cells[0];
    if (!first) return [];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(first.date);
      date.setUTCDate(first.date.getUTCDate() + index);
      return formatWeekdayShort(date, locale);
    });
  }, [cells, locale]);

  const todayIso = todayKeyInZone(timezone);
  const todayUtc = isoDateUtc(new Date());
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AE',location:'month-grid.tsx:today',message:'calendar today highlight',data:{timezone,todayIso,todayUtc,mismatch:todayIso!==todayUtc},timestamp:Date.now()})}).catch(()=>{});
  }, [timezone, todayIso, todayUtc]);
  // #endregion
  const range = useMemo(() => {
    const start = cells[0]?.date;
    const end = cells[cells.length - 1]?.date;
    if (!start || !end) return null;
    const fromYmd = isoDateUtc(start);
    const toYmd = isoDateUtc(end);
    const instants = utcInstantRangeForYmd(fromYmd, toYmd);
    return {
      fromYmd,
      toYmd,
      from: instants.from,
      to: instants.to,
    };
  }, [cells]);

  async function load() {
    const dayFrom = range?.fromYmd;
    const dayTo = range?.toYmd;
    const [monthEvents, monthTasks, monthNotes, monthLeaves, holidayRows, policy] = await Promise.all([
      range
        ? api.get<CalendarMeeting[]>(
            `/calendar/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          )
        : Promise.resolve([]),
      range
        ? api.get<CalendarTask[]>(
            `/tasks?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          )
        : Promise.resolve([]),
      range
        ? api.get<CalendarNote[]>(
            `/notes?from=${encodeURIComponent(dayFrom!)}&to=${encodeURIComponent(dayTo!)}`,
          )
        : Promise.resolve([]),
      range
        ? api.get<CalendarLeave[]>(
            `/leaves?from=${encodeURIComponent(dayFrom!)}&to=${encodeURIComponent(dayTo!)}`,
          )
        : Promise.resolve([]),
      api.get<Holiday[]>('/holidays'),
      api.get<{ workDays?: number[]; timezone?: string } | null>('/companies/work-policy'),
    ]);
    setEvents(monthEvents);
    setTasks(monthTasks);
    setNotes(monthNotes);
    setLeaves(overlayLeaves(monthLeaves));
    setHolidays(holidayRows);
    if (policy?.workDays?.length) setWorkDays(policy.workDays);
    if (policy?.timezone) setTimezone(policy.timezone);
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'CF',location:'month-grid.tsx:load:conflicts',message:'month events carrying leave conflicts',data:{total:monthEvents.length,withConflicts:monthEvents.filter((row)=>Boolean(row.conflicts?.length)).length,titles:monthEvents.filter((row)=>row.conflicts?.length).map((row)=>row.title)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    const sample = monthEvents[0]?.startsAt ?? monthTasks[0]?.dueAt ?? null;
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AI',location:'month-grid.tsx:load',message:'calendar fetch range padded',data:{timezone:policy?.timezone??'Asia/Tehran',fromYmd:dayFrom,toYmd:dayTo,from:range?.from,to:range?.to,sample,zoned:sample?dateKeyInZone(sample,policy?.timezone??'Asia/Tehran'):null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  useEffect(() => {
    load().catch(console.error);
  }, [range?.from, range?.to]);

  return (
    <div className="stack cal-month">
      <div className="cal-month__nav">
        <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, -1))}>
          {t('calendar.prev')}
        </button>
        <h1>
          {t('calendar.title')}
          <div className="muted">{title}</div>
        </h1>
        <div className="cal-month__nav-end">
          <button className="btn btn-ghost" type="button" onClick={() => setAnchor(new Date())}>
            {t('calendar.today')}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, 1))}>
            {t('calendar.next')}
          </button>
        </div>
      </div>
      <div className="cal-month__weekdays">
        {weekdayLabels.map((label, index) => (
          <span className="cal-month__weekday" key={index}>
            {label}
          </span>
        ))}
      </div>
      <div className="cal-month__grid">
        {cells.map((cell) => {
          const iso = isoDateUtc(cell.date);
          const dayEvents = events.filter((item) =>
            overlapsZonedYmd(item.startsAt, item.endsAt, iso, timezone),
          );
          const dayTasks = tasks.filter((item) => item.dueAt && eventIso(item.dueAt, timezone) === iso);
          const dayNotes = notes.filter((item) => eventIso(item.date) === iso);
          const dayLeaves = leaves.filter((item) => leaveOnDay(item, iso));
          const holiday = holidays.find((item) => eventIso(item.date) === iso);
          return (
            <div
              className="cal-month__tile"
              data-in-month={cell.inMonth}
              data-today={iso === todayIso}
              key={iso}
              onClick={() => setComposer(iso)}
            >
              <GunbadDay date={cell.date} locale={locale} rest={!workDays.includes(cell.date.getUTCDay())} size="month">
                {holiday ? (
                  <span className="cal-month__holiday">
                    {locale === 'fa' ? holiday.nameFa || holiday.name : holiday.name}
                  </span>
                ) : null}
                {dayLeaves.map((item) => (
                  <button
                    className="cal-month__chip cal-month__chip--leave"
                    data-status={item.status.toLowerCase()}
                    type="button"
                    key={item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setLeaveDraft(item);
                    }}
                  >
                    {t('calendar.leaveChip', { name: item.user.fullName })}
                    {item.kind === 'HOURLY'
                      ? ` · ${t('calendar.hourlyLeave', { hours: String(item.hours ?? 0) })}`
                      : ''}
                  </button>
                ))}
                {dayEvents.map((item) => {
                  const clash = meetingConflictLabel(t, item.conflicts);
                  return (
                    <button
                      className="cal-month__chip cal-month__chip--meeting"
                      data-conflict={Boolean(clash)}
                      type="button"
                      key={item.id}
                      title={clash || undefined}
                      aria-label={clash ? `${item.title}. ${clash}` : item.title}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDraft({ dayIso: iso, meeting: item });
                      }}
                    >
                      {item.title}
                    </button>
                  );
                })}
                {dayTasks.map((item) => (
                  <button
                    className="cal-month__chip cal-month__chip--task"
                    data-starred={item.starred}
                    type="button"
                    key={item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setTaskDraft({ dayIso: iso, task: item });
                    }}
                  >
                    {item.title}
                  </button>
                ))}
                {dayNotes.map((item) => (
                  <button
                    className="cal-month__chip cal-month__chip--note"
                    type="button"
                    key={item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setNoteDraft({ dayIso: iso, note: item });
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </GunbadDay>
            </div>
          );
        })}
      </div>
      <MeetingModal
        open={!!draft}
        dayIso={draft?.dayIso ?? todayIso}
        meeting={draft?.meeting ?? null}
        timezone={timezone}
        onClose={() => setDraft(null)}
        onSaved={load}
      />
      <TaskModal
        open={!!taskDraft}
        dayIso={taskDraft?.dayIso ?? todayIso}
        task={taskDraft?.task ?? null}
        timezone={timezone}
        onClose={() => setTaskDraft(null)}
        onSaved={load}
      />
      <NoteModal
        open={!!noteDraft}
        dayIso={noteDraft?.dayIso ?? todayIso}
        note={noteDraft?.note ?? null}
        timezone={timezone}
        onClose={() => setNoteDraft(null)}
        onSaved={load}
      />
      <LeavePreview open={!!leaveDraft} leave={leaveDraft} onClose={() => setLeaveDraft(null)} />
      <Modal
        open={!!composer}
        onClose={() => setComposer(null)}
        title={t('calendar.title')}
      >
        <div className="cal-month__compose">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (!composer) return;
              setDraft({ dayIso: composer, meeting: null });
              setComposer(null);
            }}
          >
            {t('calendar.newMeeting')}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (!composer) return;
              setTaskDraft({ dayIso: composer, task: null });
              setComposer(null);
            }}
          >
            {t('calendar.newTask')}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (!composer) return;
              setNoteDraft({ dayIso: composer, note: null });
              setComposer(null);
            }}
          >
            {t('calendar.newNote')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
