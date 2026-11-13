import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { ADMIN_EMAIL, verifyAdminLogin } from '../services/adminAuth';
import { DEFAULT_LOGO_URL, ORG_NAME, ORG_TAGLINE } from '../types';
import { OrgLogo } from './OrgLogo';

interface AdminLoginPageProps {
  logoUrl?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  logoUrl,
  onSuccess,
  onBack,
}) => {
  const activeLogoSrc = logoUrl || DEFAULT_LOGO_URL;
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('অনুগ্রহ করে অ্যাডমিন ইমেইল ও পাসওয়ার্ড লিখুন।');
      return;
    }
    if (verifyAdminLogin(email, password)) {
      setError('');
      onSuccess();
      return;
    }
    setError('ভুল অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিন।');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-3 text-left whitespace-nowrap shrink-0"
          >
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              {ORG_NAME}
            </span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            মূল পোর্টালে ফিরুন
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
          <div className="flex flex-col items-center text-center">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
            <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">{ORG_NAME}</h1>
            <p className="mt-1 text-sm text-slate-500">অ্যাডমিন প্যানেল লগইন · {ORG_TAGLINE}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">
                অ্যাডমিন ইমেইল
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                placeholder={ADMIN_EMAIL}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
                পাসওয়ার্ড
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  placeholder="আপনার অ্যাডমিন পাসওয়ার্ড লিখুন"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap"
            >
              <Lock className="h-4 w-4" />
              অ্যাডমিন প্যানেলে প্রবেশ করুন
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {ORG_NAME} · সর্বস্বত্ব সংরক্ষিত
      </footer>
    </div>
  );
};
