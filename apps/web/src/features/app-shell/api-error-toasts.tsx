'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import './api-error-toasts.css';

type ApiErrorDetail = {
  message?: string;
  status?: number;
  path?: string;
};

export function ApiErrorToasts() {
  const t = useTranslations('common');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onErr = (event: Event) => {
      const detail = (event as CustomEvent<ApiErrorDetail>).detail;
      // #region agent log
      fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'Z',location:'api-error-toasts.tsx',message:'api error toast',data:{status:detail?.status??null,path:detail?.path??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setMessage(detail?.message?.trim() || t('error'));
    };
    window.addEventListener('teamora-api-error', onErr);
    return () => window.removeEventListener('teamora-api-error', onErr);
  }, [t]);

  if (!message) return null;

  return (
    <div className="api-error-toast" role="alert">
      <p>{message}</p>
      <button className="btn btn-ghost" type="button" onClick={() => setMessage(null)} aria-label={t('error')}>
        ×
      </button>
    </div>
  );
}
