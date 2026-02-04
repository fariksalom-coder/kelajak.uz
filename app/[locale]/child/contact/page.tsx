'use client';

import { useTranslations } from 'next-intl';

const CONTACT = {
  telegram: 'https://t.me/kelajak_uz',
  whatsapp: 'https://wa.me/998901234567',
  email: 'admin@kelajak.uz',
};

export default function ChildContactPage() {
  const t = useTranslations('child');

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">{t('contactAdmin')}</h1>
      <div className="space-y-4">
        <a
          href={CONTACT.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border rounded-lg hover:bg-gray-50"
        >
          {t('contactTelegram')}
        </a>
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border rounded-lg hover:bg-gray-50"
        >
          {t('contactWhatsApp')}
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          className="block p-4 border rounded-lg hover:bg-gray-50"
        >
          {t('contactEmail')}: {CONTACT.email}
        </a>
      </div>
    </main>
  );
}
