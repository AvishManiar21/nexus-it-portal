// Base URL of the FastAPI backend. The single source for every caller,
// server or client: NEXT_PUBLIC_ values are inlined at build time, so this
// works in client components as well as route handlers and server actions.
export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
