export default function ProfileLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-7 w-24 bg-gray-200 rounded mb-6" />
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-14 bg-gray-100 rounded-xl"
          />
        ))}
      </div>
    </main>
  );
}
