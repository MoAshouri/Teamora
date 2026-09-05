'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Leave = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  user: { fullName: string };
};

export default function AdminLeavesPage() {
  const [items, setItems] = useState<Leave[]>([]);

  async function load() {
    setItems(await api.get<Leave[]>('/leaves'));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/leaves/${id}`, { status });
    await load();
  }

  return (
    <div className="stack">
      <h1>مرخصی‌ها</h1>
      <div className="card">
        {items.map((l) => (
          <div className="list-row" key={l.id}>
            <div>
              <strong>{l.user.fullName}</strong>
              <div className="muted">
                {l.type} · {l.status} · {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
              </div>
            </div>
            {l.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => review(l.id, 'APPROVED')}>
                  تأیید
                </button>
                <button className="btn btn-ghost" onClick={() => review(l.id, 'REJECTED')}>
                  رد
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
