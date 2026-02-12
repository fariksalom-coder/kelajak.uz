'use client';

/** Shown when task is open on mobile in portrait; prompts user to rotate to landscape. */
export default function RotateDeviceOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 p-6"
      aria-hidden
    >
      <div className="text-center text-white max-w-sm">
        <p className="text-lg font-medium mb-2">
          Qulaylik uchun qurilmani albom rejimiga o&apos;giring
        </p>
        <p className="text-sm text-white/90">
          Topshiriq kompyuter ekranidagi kabi ko&apos;rinadi
        </p>
      </div>
    </div>
  );
}
