import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { getSessionKey } from "./app/lib/sessionKey";

// Must match the value in app/lib/session.ts
const SESSION_TIMEOUT_MINUTES = 15;

const protectedRoutes = ["/admin"];
const publicRoutes = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // HTTPS redirect in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const httpsUrl = new URL(request.nextUrl);
    httpsUrl.protocol = "https";
    return NextResponse.redirect(httpsUrl.toString(), 301);
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
    // Apply security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    return response;
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
    // Apply security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    return response;
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
