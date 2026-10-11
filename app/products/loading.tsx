// Skeleton shown while the solutions list loads; mirrors the real layout to avoid layout shift.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading solutions">
      <section className="border-b border-line bg-canvas">
        <div className="container-page py-14 sm:py-16">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-full max-w-xl animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded bg-slate-200" />
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-line">
              <div className="aspect-[16/10] animate-pulse bg-slate-100" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
