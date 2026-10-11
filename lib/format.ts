// Shared formatting helpers.

// Shows cents only when present: 2999.99 -> "$2,999.99", 3000 -> "$3,000"
export function formatPrice(price: number): string {
  const digits = Number.isInteger(price) ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price);
}
