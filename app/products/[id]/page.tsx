import { fetchProduct } from "../../../lib/api";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductViewTracker from "../../../components/ProductViewTracker";
import DemoVideoTracker from "../../../components/DemoVideoTracker";

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
      <ProductViewTracker productId={product.id} />
      <div className="max-w-3xl mx-auto">
        <Link
          href="/products"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6 inline-block"
        >
          &larr; Back to Services
        </Link>

        {product.image_url && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-6">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <span className="block text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
          {product.category}
        </span>
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white mb-4">
          {product.name}
        </h1>
        {product.price !== null && (
          <p className="text-2xl font-bold text-zinc-800 dark:text-white mb-4">
            ${product.price.toLocaleString()}
          </p>
        )}
        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">
          {product.description}
        </p>

        {product.demo_video && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-white mb-3">
              Demo Video
            </h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <DemoVideoTracker
                productId={product.id}
                videoUrl={product.demo_video}
                productName={product.name}
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
