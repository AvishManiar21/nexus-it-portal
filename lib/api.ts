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

export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  status: string;
  created_at: string;
}

export async function fetchLeads(
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sortBy) params.set("sort_by", sortBy);
  if (sortOrder) params.set("sort_order", sortOrder);
  const qs = params.toString();
  try {
    return await apiFetch<Lead[]>(`/leads/${qs ? `?${qs}` : ""}`, "no-store");
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}
