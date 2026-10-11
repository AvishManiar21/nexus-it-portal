import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-zinc-800 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white mb-3">
          Product Not Found
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          The product you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/products"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse All Services
          </Link>
          <Link
            href="/"
            className="inline-block border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
