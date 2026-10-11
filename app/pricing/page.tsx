import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { fetchProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import PageHeader from "@/components/site/PageHeader";
import CtaBand from "@/components/site/CtaBand";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Starting prices for every Nexus IT solution, plus custom enterprise plans. Clear proposals, no surprises.",
};

// Included with every solution (mirrors the Features page)
const INCLUDED = ["Guided onboarding and training", "Ongoing maintenance and updates", "Access control by default", "Direct support from your deployment team"];

const ENTERPRISE = [
  "Two or more solutions, deployed together",
  "Custom integrations with your existing systems",
  "Named technical contact",
  "Volume and multi-year pricing",
];

const FAQ = [
  {
    q: "What does the starting price include?",
    a: "The starting price covers a standard deployment of that solution, with onboarding, maintenance and support. Your proposal lists anything beyond that before you commit.",
  },
  {
    q: "What changes the final price?",
    a: "Mostly the size of your environment, the number of users and any integrations with systems you already run. We explain each item in writing.",
  },
  {
    q: "Can I start with one solution and add more later?",
    a: "Yes. Most customers start with the area that matters most today and add others later. Combining solutions qualifies for enterprise pricing.",
  },
  {
    q: "Do you offer a demo before purchase?",
    a: "Yes. Request a demo and we will walk you through the solution using a setup close to your own, at no cost.",
  },
  {
    q: "How quickly will I hear back?",
    a: "We review every demo request and contact message within one business day.",
  },
];

// Five subgrid rows (header, price, description, checklist, actions) so the same
// part of every card lines up across a row, whatever the text length.
function PlanCard({
  category,
  name,
  priceLabel,
  price,
  description,
  items,
  highlighted = false,
  children,
}: {
  category: string;
  name: string;
  priceLabel: string;
  price: string;
  description: string;
  items: readonly string[];
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`row-span-5 grid grid-rows-subgrid gap-0 rounded-lg bg-white p-7 ${
        highlighted ? "border-2 border-ink" : "border border-line"
      }`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{category}</p>
        <h2 className="mt-2 text-xl font-semibold">{name}</h2>
      </div>
      <div className="mt-6">
        <p className="text-sm text-muted">{priceLabel}</p>
        <p className="font-heading text-4xl font-semibold tabular-nums text-ink">{price}</p>
      </div>
      <p className="mt-4 leading-relaxed">{description}</p>
      <ul className="mt-6 space-y-3 border-t border-line pt-6">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col justify-end gap-2 pt-8">{children}</div>
    </div>
  );
}

export default async function PricingPage() {
  const products = await fetchProducts();
  const priced = products.filter((p) => p.price !== null);

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Clear starting prices. Proposals without surprises."
        intro="Every solution includes onboarding, maintenance and support. Your final price depends on the size of your environment, and we put every line item in writing."
      />

      <section className="py-20">
        <div className="container-page">
          <div className={`grid gap-x-6 gap-y-6 md:grid-cols-2 ${priced.length >= 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {priced.map((product) => (
              <PlanCard
                key={product.id}
                category={product.category ?? ""}
                name={product.name}
                priceLabel="Starting at"
                price={formatPrice(product.price!)}
                description={product.description ?? ""}
                items={INCLUDED}
              >
                <Link href="/rfd" className="btn btn-primary w-full">Request a demo</Link>
                <Link href={`/products/${product.id}`} className="btn btn-secondary w-full">View details</Link>
              </PlanCard>
            ))}
            <PlanCard
              highlighted
              category="Custom"
              name="Enterprise"
              priceLabel="Pricing"
              price="Tailored"
              description="For organizations combining solutions or with specific security and integration requirements."
              items={ENTERPRISE}
            >
              <Link href="/contact" className="btn btn-primary w-full">Contact sales</Link>
            </PlanCard>
          </div>

          <p className="mt-8 text-sm text-muted">
            Prices in USD, excluding applicable taxes. Final pricing is confirmed in your written proposal.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-canvas py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold">Pricing questions</h2>
            <p className="mt-3 leading-relaxed">
              Something else? <Link href="/contact" className="font-semibold text-brand hover:text-brand-hover">Ask us directly</Link>.
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-heading text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-5 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
