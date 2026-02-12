'use client';

import { useEffect, useState } from 'react';
import { useChildId } from '@/contexts/ChildIdContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string | null;
  referredUsers: Array<{ id: string; firstName: string; lastName: string }>;
};

export default function ChildProfilePage() {
  const childId = useChildId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('child');
  const q = searchParams.get('asChild') ? `?asChild=${searchParams.get('asChild')}` : '';
  const referralPath = pathname.replace(/profile$/, 'referral') + q;
  const contactPath = pathname.replace(/profile$/, 'contact') + q;
  const prefix = '/uz';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [parentGateAnswer, setParentGateAnswer] = useState('');
  const [parentGateError, setParentGateError] = useState('');
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [parentGateQuestion, setParentGateQuestion] = useState('');
  const [parentGateCorrect, setParentGateCorrect] = useState(0);

  const generateParentGateQuestion = () => {
    const tasks: Array<{ text: string; answer: number }> = [
      { text: '√49 = ?', answer: 7 },
      { text: '√64 = ?', answer: 8 },
      { text: '√81 = ?', answer: 9 },
      { text: '√36 = ?', answer: 6 },
      { text: '√25 = ?', answer: 5 },
      { text: '√100 = ?', answer: 10 },
      { text: '√16 = ?', answer: 4 },
      { text: '5 + 3 = ?', answer: 8 },
      { text: '7 + 4 = ?', answer: 11 },
      { text: '6 × 2 = ?', answer: 12 },
      { text: '9 − 4 = ?', answer: 5 },
      { text: '15 − 7 = ?', answer: 8 },
    ];
    const task = tasks[Math.floor(Math.random() * tasks.length)]!;
    setParentGateQuestion(task.text);
    setParentGateCorrect(task.answer);
  };

  const openParentGate = () => {
    setParentGateAnswer('');
    setParentGateError('');
    generateParentGateQuestion();
    setParentGateOpen(true);
  };

  useEffect(() => {
    fetch(`/api/child/${childId}/profile`)
      .then((r) => r.json())
      .then(setProfile);
  }, [childId]);

  const handleParentGate = () => {
    const num = parseInt(parentGateAnswer.trim(), 10);
    if (num === parentGateCorrect) {
      setParentGateOpen(false);
      setParentGateError('');
      router.push(`${prefix}/parent`);
      router.refresh();
    } else {
      setParentGateError(t('parentGateWrong'));
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/uz' });
    router.refresh();
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess(false);
    setChangePasswordOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError(t('passwordsMismatch') || '');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError(t('passwordTooShort') || '');
      return;
    }
    setChangePasswordLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setChangePasswordLoading(false);
    if (!res.ok) {
      setChangePasswordError(t((data.error as string) || 'serverError') || data.error || 'Error');
      return;
    }
    setChangePasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => {
      setChangePasswordOpen(false);
      setChangePasswordSuccess(false);
    }, 1500);
  };

  if (!profile) return <div className="p-4">Loading...</div>;

  const referralLink =
    profile.referralCode &&
    (typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${profile.referralCode}` : '');

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">{t('profile')}</h1>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600">
            {profile.firstName[0]}
          </div>
          <div>
            <div className="font-medium">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="text-sm text-gray-600">{profile.email}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={openParentGate}
          className="w-full py-3 text-left px-4 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:bg-blue-50 hover:border-blue-300 text-gray-800 font-medium"
        >
          {t('goToParent')}
        </button>
        <Link
          href={referralPath}
          className="block w-full py-3 text-left px-4 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:bg-blue-50 hover:border-blue-300 text-gray-800 font-medium"
        >
          {t('inviteFriend')}
        </Link>
        <Link
          href={contactPath}
          className="block w-full py-3 text-left px-4 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:bg-blue-50 hover:border-blue-300 text-gray-800 font-medium"
        >
          {t('contactAdmin')}
        </Link>
        <button
          type="button"
          onClick={openChangePassword}
          className="w-full py-3 text-left px-4 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:bg-blue-50 hover:border-blue-300 text-gray-800 font-medium"
        >
          {t('changePassword')}
        </button>
        <button
          type="button"
          onClick={() => setLogoutConfirm(true)}
          className="w-full py-3 text-left px-4 bg-white border-2 border-red-200 rounded-xl shadow-md hover:bg-red-50 hover:border-red-300 text-red-600 font-medium"
        >
          {t('logout')}
        </button>
      </div>

      {parentGateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold mb-2">{t('parentGateQuestion')}</h3>
            <p className="mb-2">{parentGateQuestion}</p>
            <input
              type="number"
              value={parentGateAnswer}
              onChange={(e) => setParentGateAnswer(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {parentGateError && (
              <p className="text-red-600 text-sm mb-2">{parentGateError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParentGate}
                className="flex-1 py-2 bg-blue-600 text-white rounded"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setParentGateOpen(false);
                  setParentGateError('');
                }}
                className="flex-1 py-2 border rounded"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold mb-4">{t('changePasswordTitle')}</h3>
            {changePasswordSuccess ? (
              <p className="text-green-600">{t('changePasswordSuccess')}</p>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border rounded px-3 py-2"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('confirmNewPassword')}</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                    autoComplete="new-password"
                  />
                </div>
                {changePasswordError && (
                  <p className="text-red-600 text-sm">{changePasswordError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="flex-1 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {changePasswordLoading ? '...' : t('changePassword')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangePasswordOpen(false)}
                    className="flex-1 py-2 border rounded"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {logoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <p className="mb-4">{t('logoutConfirm')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2 bg-red-600 text-white rounded"
              >
                {t('yes')}
              </button>
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 py-2 border rounded"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
