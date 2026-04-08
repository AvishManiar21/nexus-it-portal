import { fetchProduct } from "../../../lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(Number(id));

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2">
            Product Not Found
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            This product could not be loaded. Please try again later.
          </p>
          <a
            href="/products"
            className="text-blue-600 hover:underline"
          >
            Back to Services
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <a
          href="/products"
          className="text-blue-600 hover:underline text-sm mb-6 inline-block"
        >
          &larr; Back to Services
        </a>

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
                title={`${product.name} demo`}
              />
            </div>
          </div>
        )}

        <a
          href="/rfd"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Request a Demo
        </a>
      </div>
    </div>
  );
}
