const API_URL = process.env.NEXT_PUBLIC_API_URL; // reads backend URL from .env.local

// Fetch all products from backend
export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }
    return res.json(); // returns parsed JSON data
  } catch (error) {
    console.error(error);
    return []; // fallback empty array
  }
}
