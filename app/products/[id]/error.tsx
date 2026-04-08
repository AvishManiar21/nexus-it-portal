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
    console.error("Product detail error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-4">
          Unable to Load Product
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          We encountered an error while loading this product. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <Link
            href="/products"
            className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors font-medium"
          >
            Browse All Services
          </Link>
        </div>
      </div>
    </div>
  );
}
