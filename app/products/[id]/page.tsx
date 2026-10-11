import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check } from "lucide-react";
import { fetchProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import ProductViewTracker from "@/components/ProductViewTracker";
import DemoVideoTracker from "@/components/DemoVideoTracker";
import CtaBand from "@/components/site/CtaBand";

interface Props {
  params: Promise<{ id: string }>;
}

const INCLUDED = ["Guided onboarding and training", "Ongoing maintenance and updates", "Access control by default", "Direct support from your deployment team"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(Number(id));
  if (!product) return { title: "Solution not found" };
  return {
    title: product.name,
    description: product.description || `Learn more about ${product.name}`,
    openGraph: { title: product.name, description: product.description || undefined, images: product.image_url ? [product.image_url] : undefined },
  };
}

export default async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(Number(id));
  if (!product) notFound();

  return (
    <>
      <ProductViewTracker productId={product.id} />

      <section className="border-b border-line bg-canvas">
        <div className="container-page py-12 sm:py-14">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All solutions
          </Link>
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">{product.category}</p>
              <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{product.name}</h1>
              <p className="mt-5 text-lg leading-relaxed">{product.description}</p>
              {product.price !== null && (
                <p className="mt-6 text-muted">
                  Starting at <span className="font-heading text-2xl font-semibold tabular-nums text-ink">{formatPrice(product.price)}</span>
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/rfd" className="btn btn-primary">Request a demo</Link>
                <Link href="/pricing" className="btn btn-secondary">See pricing</Link>
              </div>
            </div>
            {product.image_url && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-line bg-white">
                <Image src={product.image_url} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            {product.demo_video ? (
              <>
                <h2 className="text-2xl font-semibold">Demo video</h2>
                <p className="mt-2">A short walkthrough of {product.name}.</p>
                <div className="mt-6 aspect-video overflow-hidden rounded-lg border border-line bg-canvas">
                  <DemoVideoTracker productId={product.id} videoUrl={product.demo_video} productName={product.name} />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">See it live</h2>
                <p className="mt-2 leading-relaxed">Request a demo and we will walk you through {product.name} using a setup close to your own.</p>
              </>
            )}
          </div>

          <aside className="h-fit rounded-lg border border-line p-6">
            <h2 className="text-lg font-semibold">Included</h2>
            <ul className="mt-4 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/rfd" className="btn btn-primary mt-6 w-full">Request a demo</Link>
          </aside>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
