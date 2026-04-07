interface ProductCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
}

export default function ProductCard({ id, title, category, description }: ProductCardProps) {
  return (
    <a href={`/products/${id}`} className="block p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-zinc-900">
      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{category}</span>
      <h3 className="text-lg font-bold text-zinc-800 dark:text-white mt-1 mb-2">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">{description}</p>
      <span className="inline-block mt-4 text-blue-600 text-sm font-medium hover:underline">Learn more →</span>
    </a>
  );
}