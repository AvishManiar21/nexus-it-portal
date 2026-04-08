import { fetchProduct } from "../../../lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(Number(id));

  if (!product) {
    return {
      title: "Product Not Found | Nexus-IT Solutions",
    };
  }

  return {
    title: `${product.name} | Nexus-IT Solutions`,
    description: product.description || `Learn more about ${product.name}`,
  };
}

export default async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(Number(id));

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/products"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6 inline-block"
        >
          &larr; Back to Services
        </Link>

        <span className="block text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
          {product.category}
        </span>
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white mb-4">
          {product.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">
          {product.description}
        </p>

        {product.demo_video && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-white mb-3">
              Demo Video
            </h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <iframe
                src={product.demo_video}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
                title={`${product.name} demo video`}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/rfd"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Request a Demo
          </Link>
          <Link
            href="/products"
            className="inline-block border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Browse All Services
          </Link>
        </div>
      </div>
    </div>
  );
}
