'use client';

import { useCallback, useEffect, useState } from 'react';
import { remindersApi, type DueReminder } from '@/lib/api';

const POLL_MS = 45_000;

export function useDueReminders() {
  const [items, setItems] = useState<DueReminder[]>([]);

  const reload = useCallback(async () => {
    try {
      setItems(await remindersApi.due());
    } catch {
      /* keep last list; the bell stays quiet on network errors */
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => {
      void reload();
    }, POLL_MS);
    const onFocus = () => {
      void reload();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { items, count: items.length, reload };
}
