export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-2 animate-pulse" />
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-96 mb-10 animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="block p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-3 animate-pulse" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-1 animate-pulse" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
