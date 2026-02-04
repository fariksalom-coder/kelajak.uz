'use client';

import { useEffect, useState } from 'react';
import { useChildId } from '@/contexts/ChildIdContext';
import { useTranslations } from 'next-intl';

type ProfileData = {
  referralCode: string | null;
  referredUsers: Array<{ id: string; firstName: string; lastName: string }>;
};

export default function ChildReferralPage() {
  const childId = useChildId();
  const t = useTranslations('child');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/child/${childId}/profile`)
      .then((r) => r.json())
      .then(setProfile);
  }, [childId]);

  if (!profile) return <div className="p-4">Loading...</div>;

  const referralLink =
    profile.referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${profile.referralCode}`
      : '';

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">{t('inviteFriend')}</h1>
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">{t('referralLink')}</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 border rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <button
            type="button"
            onClick={copyLink}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {copied ? '✓' : t('copy')}
          </button>
        </div>
      </div>
      <h2 className="font-medium mb-2">{t('referredUsers')}</h2>
      <ul className="space-y-2">
        {profile.referredUsers.map((u) => (
          <li key={u.id} className="border rounded p-2">
            {u.firstName} {u.lastName}
          </li>
        ))}
        {profile.referredUsers.length === 0 && (
          <li className="text-gray-600 text-sm">Hali yo&apos;q.</li>
        )}
      </ul>
    </main>
  );
}
