import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarCheck, FileText, Headset, LifeBuoy, ShieldCheck, Users } from "lucide-react";
import { fetchProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import CtaBand from "@/components/site/CtaBand";

const REASONS = [
  {
    icon: Users,
    title: "One accountable partner",
    text: "A single team owns your rollout from the first call to day-to-day support. No hand-offs between vendors.",
  },
  {
    icon: FileText,
    title: "Clear, published pricing",
    text: "Every solution has a starting price on our pricing page. Your proposal explains exactly what changes it.",
  },
  {
    icon: ShieldCheck,
    title: "Security from the start",
    text: "Access control, monitoring and least-privilege defaults are part of every deployment, not an add-on.",
  },
  {
    icon: LifeBuoy,
    title: "Support that knows your setup",
    text: "The people who deployed your systems are the people who answer when something needs attention.",
  },
];

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Request a demo",
    text: "Tell us about your team and the solutions you are interested in. It takes about two minutes.",
  },
  {
    icon: Headset,
    title: "Talk to our team",
    text: "We review every request within one business day and schedule a walkthrough built around your use case.",
  },
  {
    icon: ShieldCheck,
    title: "Deploy with confidence",
    text: "You get a written proposal, a rollout plan and ongoing support from the same team.",
  },
];

export default async function HomePage() {
  const products = await fetchProducts();

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow">IT solutions for growing businesses</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.15] sm:text-5xl">
              Infrastructure, security and analytics your business can depend on.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed">
              Nexus IT designs, deploys and supports the systems your teams rely on every day, with one partner
              accountable from the first conversation to ongoing support.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/rfd" className="btn btn-primary">
                Request a demo
              </Link>
              <Link href="/products" className="btn btn-secondary">
                Explore solutions
              </Link>
            </div>
          </div>

          {products.length > 0 && (
            <div className="rounded-lg border border-line bg-white">
              <div className="border-b border-line px-6 py-4">
                <p className="text-sm font-semibold text-ink">Our solutions</p>
              </div>
              <ul className="divide-y divide-line">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors duration-150 hover:bg-canvas"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{product.category}</p>
                        <p className="mt-1 font-heading text-lg font-medium text-ink">{product.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {product.price !== null && (
                          <span className="text-sm text-muted">from {formatPrice(product.price)}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted transition-colors group-hover:text-brand" aria-hidden />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Solutions */}
      {products.length > 0 && (
        <section className="py-20">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="eyebrow">Solutions</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Built for the work your teams actually do</h2>
              <p className="mt-4 text-lg leading-relaxed">
                Start with the solution you need most. Each one is deployed and supported by the same team.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-colors duration-150 hover:border-slate-300"
                >
                  {product.image_url && (
                    <div className="relative aspect-[16/10] bg-canvas">
                      <Image
                        src={product.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{product.category}</p>
                    <h3 className="mt-2 text-xl font-semibold">{product.name}</h3>
                    <p className="mt-3 line-clamp-3 leading-relaxed">{product.description}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-brand">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Nexus */}
      <section className="border-y border-line bg-canvas py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Why Nexus IT</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">How we work with you</h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-white">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Getting started</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From first call to running in production</h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="border-t-2 border-ink pt-6">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-sm font-semibold text-muted">0{i + 1}</span>
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
