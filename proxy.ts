import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { getSessionKey } from "./app/lib/sessionKey";
import { BACKEND_API_URL } from "./lib/backend";

// Must match the value in app/lib/session.ts
const SESSION_TIMEOUT_MINUTES = 15;

const isDev = process.env.NODE_ENV !== "production";

// Production redirects HTTP to HTTPS. FORCE_HTTPS=false turns that off for a
// production build served over plain http://localhost (docker compose).
const forceHttps = !isDev && process.env.FORCE_HTTPS !== "false";

// Next.js inlines bootstrap scripts, so script-src needs 'unsafe-inline' (no
// nonce setup); dev additionally needs 'unsafe-eval' and a websocket for HMR.
// YouTube serves the IFrame API script and the embedded player. Product
// images are arbitrary HTTPS URLs set by admins.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.youtube.com https://s.ytimg.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${BACKEND_API_URL}${isDev ? " ws:" : ""}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

const protectedRoutes = ["/admin"];
const publicRoutes = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // HTTPS redirect in production. Use the Host the visitor asked for:
  // request.nextUrl carries the server's bind address (e.g. 0.0.0.0:3000).
  if (forceHttps && request.headers.get("x-forwarded-proto") !== "https") {
    const host = request.headers.get("host") ?? request.nextUrl.host;
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 301);
  }

  // Allow public routes (login page)
  const isPublicRoute = publicRoutes.some((route) => path === route);
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || (path.startsWith(route + "/") && !isPublicRoute)
  );

  if (!isProtectedRoute) {
    const response = NextResponse.next();
    if (!request.cookies.get("visitor_session_id")) {
      response.cookies.set("visitor_session_id", crypto.randomUUID(), {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    }
    return applySecurityHeaders(response);
  }

  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Resolve outside the try so a missing secret surfaces instead of looking like a bad token.
  const key = getSessionKey();

  try {
    // Verify the current session — this will throw if expired or invalid
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ["HS256"],
    });

    // Sliding window: issue a fresh token with a reset expiry on every request
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
    const newToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      expiresAt: expiresAt.toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_TIMEOUT_MINUTES}m`)
      .sign(key);

    const response = NextResponse.next();
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });
    return applySecurityHeaders(response);
  } catch {
    // Expired or invalid session — clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/admin/login?expired=1", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
