import Link from "next/link";

// Closing call-to-action band shared by marketing pages.
export default function CtaBand({
  title = "See how it would work for your team",
  text = "Tell us what you are running today. We will walk you through the right setup and give you a clear proposal.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-ink">
      <div className="container-page flex flex-col items-start gap-8 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-white">{title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-300">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/rfd" className="btn btn-on-dark">Request a demo</Link>
          <Link href="/contact" className="btn border border-slate-600 text-white hover:border-slate-400">
            Contact sales
          </Link>
        </div>
      </div>
    </section>
  );
}
