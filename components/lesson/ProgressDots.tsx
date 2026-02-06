'use client';

export default function ProgressDots({
  total = 5,
  current = 1,
}: {
  total?: number;
  current?: number;
}) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            i + 1 <= current ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
