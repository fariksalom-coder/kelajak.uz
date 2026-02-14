export default function StatsLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-7 w-24 bg-gray-200 rounded mb-6" />
      <section className="mb-8">
        <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 rounded mb-1" />
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden" />
      </section>
      <section className="mb-8">
        <div className="h-5 w-36 bg-gray-200 rounded mb-3" />
        <div className="flex gap-2 items-end justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t min-h-[4px] h-12" />
              <span className="h-3 w-6 bg-gray-100 rounded mt-1" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="border rounded-xl p-4 bg-gray-50/80">
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-100 rounded mb-1" />
              <div className="h-2.5 bg-gray-200 rounded-full" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
