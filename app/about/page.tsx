import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import CtaBand from "@/components/site/CtaBand";

export const metadata: Metadata = {
  title: "About",
  description: "Nexus IT helps growing businesses run infrastructure, security and analytics they can depend on.",
};

const PRINCIPLES = [
  {
    title: "Plain answers",
    text: "We explain what a system does, what it costs and what could go wrong, in language your whole team understands.",
  },
  {
    title: "Ownership",
    text: "The team that designs your deployment is the team that supports it. Nobody has to re-learn your setup.",
  },
  {
    title: "Security as a default",
    text: "Least-privilege access, monitoring and regular reviews are part of how we build, not a separate project.",
  },
  {
    title: "Fit over upsell",
    text: "We recommend the smallest setup that meets your needs and tell you when you do not need something.",
  },
];

const COMMITMENTS = [
  { label: "Response time", value: "Every demo request and message reviewed within one business day" },
  { label: "Pricing", value: "Starting prices published; every proposal itemized in writing" },
  { label: "Support", value: "Direct access to the engineers who know your environment" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="We help growing businesses run IT they can depend on"
        intro="Nexus IT designs, deploys and supports cloud infrastructure, analytics and cybersecurity for companies that need their systems to just work."
      />

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">What we do</h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed">
              <p>
                Most growing companies reach a point where their systems need more care than the team has time for:
                infrastructure that has to scale, data that should inform decisions, and security that cannot be an
                afterthought.
              </p>
              <p>
                We take that on. We start by understanding how your business runs today, recommend a setup that fits,
                deploy it, and stay on as the team that keeps it healthy.
              </p>
            </div>
            <p className="mt-6">
              <Link href="/features" className="font-semibold text-brand hover:text-brand-hover">
                See what each solution includes &rarr;
              </Link>
            </p>
          </div>

          <div className="rounded-lg border border-line">
            <h2 className="border-b border-line px-6 py-4 text-lg font-semibold">Our commitments</h2>
            <dl className="divide-y divide-line">
              {COMMITMENTS.map(({ label, value }) => (
                <div key={label} className="grid gap-1 px-6 py-5 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <dt className="font-semibold text-ink">{label}</dt>
                  <dd className="leading-relaxed">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-canvas py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">How we work</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">The principles behind every engagement</h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PRINCIPLES.map(({ title, text }) => (
              <div key={title} className="border-l-2 border-brand pl-5">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Let's talk about your systems" />
    </>
  );
}
