import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Cloud,
  Gauge,
  GraduationCap,
  KeyRound,
  LineChart,
  Radar,
  ScanSearch,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import CtaBand from "@/components/site/CtaBand";

export const metadata: Metadata = {
  title: "Features",
  description:
    "What you get with Nexus IT: cloud infrastructure management, analytics and cybersecurity capabilities, plus onboarding and support with every solution.",
};

const AREAS = [
  {
    icon: Cloud,
    name: "Cloud infrastructure",
    summary: "Keep services available and costs predictable as demand changes.",
    features: [
      { icon: Gauge, title: "Automated scaling", text: "Capacity grows and shrinks with real usage, so you pay for what you run." },
      { icon: Activity, title: "Monitoring and alerting", text: "Health, latency and resource usage tracked continuously, with alerts routed to the right people." },
      { icon: Server, title: "Managed environments", text: "Consistent production, staging and development environments maintained for you." },
    ],
  },
  {
    icon: BarChart3,
    name: "Analytics",
    summary: "Turn operational data into decisions your teams can act on.",
    features: [
      { icon: LineChart, title: "Real-time dashboards", text: "Live views of the metrics each team cares about, without waiting on manual reports." },
      { icon: BarChart3, title: "Predictive modeling", text: "Forecasts built on your historical data to plan capacity, demand and budgets ahead of time." },
      { icon: BookOpen, title: "Self-serve reporting", text: "Teams explore data on their own with governed, consistent definitions." },
    ],
  },
  {
    icon: ShieldCheck,
    name: "Cybersecurity",
    summary: "Find and close gaps before they become incidents.",
    features: [
      { icon: Radar, title: "Threat detection", text: "Suspicious activity across your systems surfaced and triaged as it happens." },
      { icon: ScanSearch, title: "Vulnerability scanning", text: "Regular scans with prioritized findings, so the riskiest issues are fixed first." },
      { icon: ShieldAlert, title: "Automated response", text: "Playbooks that contain common threats immediately and escalate the rest." },
    ],
  },
];

const INCLUDED = [
  { icon: GraduationCap, title: "Guided onboarding", text: "A rollout plan, kickoff session and training for the people who will use the system." },
  { icon: Wrench, title: "Ongoing maintenance", text: "Updates, patches and configuration changes handled by the team that deployed it." },
  { icon: KeyRound, title: "Access control by default", text: "Least-privilege permissions and audited access for every deployment." },
  { icon: BellRing, title: "Direct support", text: "Reach the engineers who know your setup, instead of a generic queue." },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything you need to run dependable IT"
        intro="Three solution areas that work on their own or together, each delivered with onboarding, maintenance and support from one team."
      />

      {AREAS.map(({ icon: AreaIcon, name, summary, features }, i) => (
        <section key={name} className={i % 2 === 1 ? "border-y border-line bg-canvas py-20" : "py-20"}>
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand">
                <AreaIcon className="h-5 w-5 text-white" aria-hidden />
              </div>
              <h2 className="mt-5 text-3xl font-semibold">{name}</h2>
              <p className="mt-3 text-lg leading-relaxed">{summary}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 lg:gap-6">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Included with every solution</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Not just software. A team behind it.</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-line p-6">
                <Icon className="h-5 w-5 text-brand" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10">
            <Link href="/products" className="font-semibold text-brand hover:text-brand-hover">
              Browse all solutions &rarr;
            </Link>
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
