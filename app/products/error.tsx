"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Solutions page error:", error);
  }, [error]);

  return (
    <section className="py-24">
      <div className="container-page max-w-2xl">
        <h1 className="text-3xl font-semibold">We could not load this page</h1>
        <p className="mt-3 text-lg leading-relaxed">Something went wrong on our side. Please try again in a moment.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-secondary">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
