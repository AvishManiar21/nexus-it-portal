// Base URL of the FastAPI backend as the browser sees it. NEXT_PUBLIC_
// values are inlined at build time, so this works in client components as
// well as route handlers and server actions.
export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

// Base URL for calls made by the Next.js server itself (route handlers,
// server actions, server components). Usually the same as above, but under
// docker compose the server reaches the backend by service name
// (http://backend:8000) while the browser still uses localhost. Read at
// runtime and undefined in the browser, where it falls back to the public URL.
export const BACKEND_SERVER_URL =
  process.env.BACKEND_INTERNAL_URL || BACKEND_API_URL;
