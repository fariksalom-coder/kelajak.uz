'use client';

type CubeSize = 'default' | 'compact';

export default function Cube({
  count = 1,
  showNumber,
  size = 'default',
}: {
  count?: number;
  showNumber?: number;
  size?: CubeSize;
}) {
  const isCompact = size === 'compact';
  const sizeClass =
    size === 'compact'
      ? count > 1
        ? 'w-7 h-7'
        : 'w-9 h-9'
      : count > 1
        ? 'w-10 h-10'
        : 'w-14 h-14';
  const wrapMax = isCompact ? 'max-w-[70px]' : 'max-w-[120px]';
  return (
    <div className="flex flex-col items-center gap-1">
      {showNumber !== undefined && (
        <span className="text-2xl font-bold text-gray-800">{showNumber}</span>
      )}
      <div className={`flex flex-wrap gap-0.5 justify-center ${wrapMax}`}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`${sizeClass} rounded-md bg-sky-400 border-2 border-sky-500 shadow-md flex-shrink-0`}
            style={{
              boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.1), 2px 2px 0 rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
