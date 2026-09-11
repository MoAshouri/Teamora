'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, authApi } from '@/lib/api';
import { LanguageSwitch } from '@/features/app-shell/language-switch';
import { EmailSection } from './email-section';
import './settings-page.css';

type Profile = {
  fullName: string;
  avatarUrl: string | null;
};

export default function SettingsPage() {
  const t = useTranslations('app');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    api
      .get<Profile>('/users/me')
      .then((row) => {
        setFullName(row.fullName);
        setAvatarUrl(row.avatarUrl ?? '');
      })
      .catch(console.error);
  }, []);

  async function onProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    try {
      const saved = await api.patch<Profile>('/users/me', {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      setFullName(saved.fullName);
      setAvatarUrl(saved.avatarUrl ?? '');
      setProfileSaved(true);
      await authApi.me();
      window.dispatchEvent(new Event('teamora-me'));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t('settings.save'));
    }
  }

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('settings.changePassword'));
    }
  }

  return (
    <div className="stack settings-room">
      <h1 style={{ marginBottom: 0 }}>{t('settings.title')}</h1>
      <section className="card settings-well">
        <h2>{t('settings.profile')}</h2>
        <form className="settings-form" onSubmit={onProfile}>
          <label className="field">
            <span>{t('settings.fullName')}</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} />
          </label>
          <label className="field">
            <span>{t('settings.avatarUrl')}</span>
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              type="url"
              maxLength={2048}
              placeholder="https://"
            />
          </label>
          {avatarUrl ? <img className="settings-avatar" src={avatarUrl} alt="" /> : null}
          {profileError ? <p className="settings-form__error">{profileError}</p> : null}
          {profileSaved ? <p className="settings-form__ok">{t('settings.saved')}</p> : null}
          <button className="btn btn-primary" type="submit">
            {t('settings.save')}
          </button>
        </form>
      </section>
      <section className="card settings-well">
        <h2>{t('settings.changePassword')}</h2>
        <form className="settings-form" onSubmit={onPassword}>
          <label className="field">
            <span>{t('settings.currentPassword')}</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className="field">
            <span>{t('settings.newPassword')}</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {passwordError ? <p className="settings-form__error">{passwordError}</p> : null}
          {passwordSaved ? <p className="settings-form__ok">{t('settings.saved')}</p> : null}
          <button className="btn btn-primary" type="submit">
            {t('settings.save')}
          </button>
        </form>
      </section>
      <section className="card settings-well">
        <h2>{t('nav.language')}</h2>
        <p className="muted">{t('settings.languageHint')}</p>
        <LanguageSwitch variant="panel" />
      </section>
      <EmailSection />
    </div>
  );
}
