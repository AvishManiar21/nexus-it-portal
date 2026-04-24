const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

async function apiFetch<T>(path: string, cacheOption?: RequestCache): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: cacheOption || "force-cache",
    next: { revalidate: 60 },
    credentials: "include"  // Send cookies for authentication
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

export interface LeadProfile {
  lead: {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    budget: string | null;
    source: string | null;
    status: string;
    created_at: string;
  };
  rfd_submissions: {
    id: number;
    message: string;
    status: string;
    created_at: string;
    product_id: number;
    products: { name: string } | null;
  }[];
  contact_messages: {
    id: number;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  }[];
  timeline: {
    type: string;
    details: string | null;
    occurred_at: string;
  }[];
  notes: {
    id: number;
    note: string;
    created_at: string;
    author: string;
  }[];
}

export async function fetchLeadProfile(id: number): Promise<LeadProfile | null> {
  try {
    return await apiFetch<LeadProfile>(`/leads/${id}/profile`, "no-store");
  } catch (error) {
    console.error(`Failed to fetch lead profile ${id}:`, error);
    return null;
  }
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
