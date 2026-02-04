'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'uz';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: `/${locale}/parent`,
    });
    setLoading(false);
    if (res?.error) {
      setError(t('invalidCredentials'));
      return;
    }
    if (res?.ok) {
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const base = `/${locale}`;
      const path = role === 'PARENT' ? '/parent' : '/child';
      router.push(`${base}${path}`);
      router.refresh();
    }
  };

  const prefix = `/${locale}`;
  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('login')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <div className="relative flex items-center gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('loginButton')}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        {t('noAccount')}{' '}
        <Link href={`${prefix}/register`} className="text-blue-600 hover:underline">
          {t('register')}
        </Link>
      </p>
    </main>
  );
}
