import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS = ["/", "/products", "/features", "/pricing", "/about", "/contact", "/rfd", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.id}` })),
  ];
}
