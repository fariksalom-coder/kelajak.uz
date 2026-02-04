'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'uz';
  const ref = searchParams.get('ref');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CHILD' as 'CHILD' | 'PARENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        ...(ref ? { ref } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail ? `${t(data.error || 'serverError')}: ${data.detail}` : t(data.error || 'serverError');
      setError(msg);
      setLoading(false);
      return;
    }
    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.ok) {
      const base = `/${locale}`;
      const path = form.role === 'PARENT' ? '/parent' : '/child';
      router.push(`${base}${path}`);
      router.refresh();
    } else {
      router.push(`/${locale}/login`);
      router.refresh();
    }
  };

  const prefix = `/${locale}`;
  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('register')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('firstName')}</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('lastName')}</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              className="w-full border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-sm text-blue-600 whitespace-nowrap"
            >
              {showPassword ? t('hidePassword') : t('showPassword')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('confirmPassword')}</label>
          <div className="flex items-center gap-2">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="w-full border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="text-sm text-blue-600 whitespace-nowrap"
            >
              {showConfirmPassword ? t('hidePassword') : t('showPassword')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('role')}</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === 'CHILD'}
                onChange={() => setForm((f) => ({ ...f, role: 'CHILD' }))}
              />
              {t('roleChild')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === 'PARENT'}
                onChange={() => setForm((f) => ({ ...f, role: 'PARENT' }))}
              />
              {t('roleParent')}
            </label>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('registerButton')}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        {t('hasAccount')}{' '}
        <Link href={`${prefix}/login`} className="text-blue-600 hover:underline">
          {t('login')}
        </Link>
      </p>
    </main>
  );
}
