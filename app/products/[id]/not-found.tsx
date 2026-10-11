import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-page max-w-2xl">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-4xl font-semibold">Solution not found</h1>
        <p className="mt-4 text-lg leading-relaxed">This solution does not exist or is no longer available.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-primary">Browse solutions</Link>
          <Link href="/" className="btn btn-secondary">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
