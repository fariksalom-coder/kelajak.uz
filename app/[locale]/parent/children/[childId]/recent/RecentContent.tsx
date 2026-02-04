'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const QUESTIONS: Record<string, string[]> = {
  default: [
    'Bu mavzuni qanday tushunding?',
    'Qaysi qismi aniq edi?',
    'Nima qiyin bo\'ldi?',
  ],
};

type Topic = { id: string; name: string; order: number };
type Subject = { id: string; name: string; order: number; topics: Topic[] };

export default function RecentContent({
  subjects,
  childId,
  feedbackByTopic,
}: {
  subjects: Subject[];
  childId: string;
  feedbackByTopic: Record<string, string>;
}) {
  const t = useTranslations('feedback');
  const [saving, setSaving] = useState<string | null>(null);
  const [localFeedback, setLocalFeedback] = useState<Record<string, string>>(feedbackByTopic);

  const questions = QUESTIONS.default;
  const levels = [
    { value: 'GOOD', label: t('good') },
    { value: 'MEDIUM', label: t('medium') },
    { value: 'DIFFICULT', label: t('difficult') },
  ] as const;

  const submitFeedback = async (topicId: string, level: string) => {
    setSaving(topicId);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, topicId, understandingLevel: level }),
    });
    setLocalFeedback((prev) => ({ ...prev, [topicId]: level }));
    setSaving(null);
  };

  if (subjects.length === 0) {
    return (
      <p className="text-gray-600">
        Hali fanlar va mavzular qo&apos;shilmagan. Administrator bilan bog&apos;laning.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {subjects.map((subject) => (
        <div key={subject.id}>
          <h2 className="text-lg font-semibold mb-3">{subject.name}</h2>
          <div className="space-y-4 pl-2">
            {subject.topics.map((topic) => (
              <div key={topic.id} className="border-l-2 border-gray-200 pl-4">
                <h3 className="font-medium">{topic.name}</h3>
                <ul className="text-sm text-gray-600 my-2">
                  {questions.map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 mt-2">
                  {levels.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={saving === topic.id}
                      onClick={() => submitFeedback(topic.id, value)}
                      className={`px-3 py-1 rounded text-sm ${
                        localFeedback[topic.id] === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
