const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

async function apiFetch<T>(path: string, cacheOption?: RequestCache): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: cacheOption || "force-cache",
    next: { revalidate: 60 }
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  image_url: string | null;
  demo_video: string | null;
  created_at: string;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    return await apiFetch<Product[]>("/products/");
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function fetchProduct(id: number): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/products/${id}`);
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}
