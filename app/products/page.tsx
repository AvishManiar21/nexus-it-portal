// app/products/page.tsx
export default function ProductsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <p className="text-gray-500">This is the product catalog page.</p>
      <ul className="mt-4 space-y-2">
        <li><a className="text-blue-500 hover:underline" href="/products/1">Product 1</a></li>
        <li><a className="text-blue-500 hover:underline" href="/products/2">Product 2</a></li>
        <li><a className="text-blue-500 hover:underline" href="/products/3">Product 3</a></li>
      </ul>
    </div>
  );
}