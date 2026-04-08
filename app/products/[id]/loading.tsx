export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-6 animate-pulse" />

        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-2 animate-pulse" />
        <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-4 animate-pulse" />
        <div className="space-y-2 mb-8">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
        </div>

        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-3 animate-pulse" />
        <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-8 animate-pulse" />

        <div className="flex gap-4">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-40 animate-pulse" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
