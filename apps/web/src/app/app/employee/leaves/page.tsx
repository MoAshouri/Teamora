'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Leave = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
};

export default function EmployeeLeavesPage() {
  const [items, setItems] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<{ remaining: number; used: number; annualAllowance: number } | null>(
    null,
  );

  async function load() {
    const [list, b] = await Promise.all([
      api.get<Leave[]>('/leaves'),
      api.get<{ remaining: number; used: number; annualAllowance: number }>('/leaves/balance/me'),
    ]);
    setItems(list);
    setBalance(b);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.post('/leaves', {
      type: String(fd.get('type')),
      startDate: String(fd.get('startDate')),
      endDate: String(fd.get('endDate')),
      reason: String(fd.get('reason') || ''),
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="stack">
      <h1>مرخصی</h1>
      <div className="card">
        <p className="muted">مانده</p>
        <div className="stat">{balance?.remaining ?? '—'}</div>
        <p className="muted">
          استفاده شده {balance?.used ?? 0} از {balance?.annualAllowance ?? 12}
        </p>
      </div>
      <div className="card">
        <h2>درخواست جدید</h2>
        <form onSubmit={create}>
          <label className="field">
            <span>نوع</span>
            <select name="type" defaultValue="ANNUAL">
              <option value="ANNUAL">سالانه</option>
              <option value="SICK">استعلاجی</option>
              <option value="UNPAID">بدون حقوق</option>
              <option value="OTHER">سایر</option>
            </select>
          </label>
          <label className="field">
            <span>از</span>
            <input name="startDate" type="date" required />
          </label>
          <label className="field">
            <span>تا</span>
            <input name="endDate" type="date" required />
          </label>
          <label className="field">
            <span>دلیل</span>
            <input name="reason" />
          </label>
          <button className="btn btn-primary" type="submit">
            ارسال
          </button>
        </form>
      </div>
      <div className="card">
        {items.map((l) => (
          <div className="list-row" key={l.id}>
            <div>
              <strong>{l.type}</strong>
              <div className="muted">
                {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
              </div>
            </div>
            <span className="muted">{l.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
