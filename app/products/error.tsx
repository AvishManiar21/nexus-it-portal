"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Products page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            We encountered an error while loading the product catalog.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
