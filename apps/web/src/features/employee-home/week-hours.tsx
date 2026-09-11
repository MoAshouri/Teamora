'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BrickWeekChart, saturdayWeekKeys } from '@/features/ui/brick-week-chart';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

export function EmployeeWeekHours({
  hoursByDay,
  workDays = DEFAULT_WORK_DAYS,
  dailyMinutes = 480,
}: {
  hoursByDay: Record<string, number>;
  workDays?: number[];
  dailyMinutes?: number;
}) {
  const t = useTranslations('app');

  const filled = useMemo(() => {
    const keys =
      Object.keys(hoursByDay).length === 7
        ? Object.keys(hoursByDay).sort()
        : saturdayWeekKeys();
    const next: Record<string, number> = {};
    for (const key of keys) next[key] = hoursByDay[key] ?? 0;
    return next;
  }, [hoursByDay]);

  const total = Object.values(filled).reduce((sum, hours) => sum + hours, 0);
  const yMax = Math.max(1, dailyMinutes / 60);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card employee-week">
      <h2>{t('employee.myWeekHours', { total: total.toFixed(1) })}</h2>
      <BrickWeekChart
        hoursByDay={filled}
        workDays={workDays.length ? workDays : DEFAULT_WORK_DAYS}
        yMax={yMax}
        highlightDate={today}
      />
    </div>
  );
}
