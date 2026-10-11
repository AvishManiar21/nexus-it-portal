import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-page max-w-2xl">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-lg leading-relaxed">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/contact" className="btn btn-secondary">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
