"use client";

import { BACKEND_API_URL } from "@/lib/backend";
import { useEffect } from "react";

interface Props {
  productId: number;
}

export default function ProductViewTracker({ productId }: Props) {
  useEffect(() => {
    const sessionId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("visitor_session_id="))
      ?.split("=")[1];

    if (!sessionId) return;

    fetch(`${BACKEND_API_URL}/events/product-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, product_id: productId }),
    }).catch(() => {});
  }, [productId]);

  return null;
}
