import { BACKEND_API_URL } from "@/lib/backend";
import { cookies } from "next/headers";

const API_URL = BACKEND_API_URL;

async function apiFetch<T>(path: string, cacheOption?: RequestCache): Promise<T> {
  // Get cookies from the incoming request to forward to the backend
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  const headers: HeadersInit = {};
  if (sessionCookie) {
    headers.Cookie = `session=${sessionCookie.value}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    cache: cacheOption || "force-cache",
    next: { revalidate: 60 },
    headers,
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
  status_history: {
    id: number;
    old_status: string;
    new_status: string;
    changed_by: string;
    created_at: string;
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

export interface LeadInsights {
  score: {
    points: number;
    label: "hot" | "warm" | "cold";
    breakdown: { reason: string; points: number }[];
  };
  insight: {
    summary: string;
    next_step: string;
    email_subject: string;
    email_body: string;
    model: string;
    generated_at: string;
  } | null;
  stale: boolean;
}

export async function fetchLeadInsights(id: number): Promise<LeadInsights | null> {
  try {
    return await apiFetch<LeadInsights>(`/leads/${id}/insights`, "no-store");
  } catch (error) {
    console.error(`Failed to fetch lead insights ${id}:`, error);
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
