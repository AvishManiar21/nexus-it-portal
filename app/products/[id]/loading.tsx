// Skeleton shown while a solution loads; mirrors the detail layout to avoid layout shift.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading solution">
      <section className="border-b border-line bg-canvas">
        <div className="container-page grid gap-10 py-12 sm:py-14 lg:grid-cols-2">
          <div className="space-y-4 pt-10">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-11 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="aspect-[16/10] animate-pulse rounded-lg bg-slate-200" />
        </div>
      </section>
    </div>
  );
}
