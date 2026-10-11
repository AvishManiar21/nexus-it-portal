import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { fetchProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import PageHeader from "@/components/site/PageHeader";
import CtaBand from "@/components/site/CtaBand";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Cloud infrastructure, analytics and cybersecurity solutions from Nexus IT, deployed and supported by one team.",
};

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <>
      <PageHeader
        eyebrow="Solutions"
        title="Solutions for infrastructure, data and security"
        intro="Each solution is deployed, maintained and supported by the same team. Start with one and add more as you grow."
      />

      <section className="py-16 sm:py-20">
        <div className="container-page">
          {products.length === 0 ? (
            <div className="rounded-lg border border-line px-6 py-16 text-center">
              <h2 className="text-xl font-semibold">Solutions are temporarily unavailable</h2>
              <p className="mt-2">Please try again shortly, or contact us and we will send you the details.</p>
              <Link href="/contact" className="btn btn-primary mt-6">Contact us</Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{product.category}</p>
                    <h2 className="mt-2 text-xl font-semibold">{product.name}</h2>
                    <p className="mt-3 line-clamp-3 leading-relaxed">{product.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-6">
                      {product.price !== null ? (
                        <span className="text-sm text-muted">
                          from <span className="font-semibold tabular-nums text-ink">{formatPrice(product.price)}</span>
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                        Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
