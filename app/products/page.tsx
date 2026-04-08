import { fetchProducts } from "../../lib/api";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog | Nexus-IT Solutions",
  description: "Browse our enterprise IT solutions including Cloud Services, Cybersecurity Solutions, and AI Analytics.",
};

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white mb-2">
          Our Services
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-10">
          Explore our enterprise solutions designed for modern businesses.
        </p>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">
              No products available at the moment.
            </p>
            <p className="text-zinc-500 text-sm">
              Please check back later or contact our support team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="block p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:shadow-md transition-shadow"
              >
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {product.category}
                </span>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-white mt-2 mb-2">
                  {product.name}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3">
                  {product.description}
                </p>
                <span className="inline-block mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
