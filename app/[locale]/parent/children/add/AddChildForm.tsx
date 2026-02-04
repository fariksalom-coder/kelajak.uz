'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function AddChildForm({ redirectPrefix }: { redirectPrefix: string }) {
  const t = useTranslations('parent');
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/parent/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age ? parseInt(form.age, 10) : null,
        email: form.email,
        password: form.password,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Error');
      return;
    }
    router.push(`${redirectPrefix}/parent`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('childName')}</label>
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('childLastName')}</label>
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('age')}</label>
        <input
          type="number"
          min={1}
          max={18}
          value={form.age}
          onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Parol</label>
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
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {t('addChild')}
      </button>
    </form>
  );
}
