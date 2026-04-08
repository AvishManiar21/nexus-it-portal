import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "nexus-it-session-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

// Must match the value in app/lib/session.ts
const SESSION_TIMEOUT_MINUTES = 15;

const protectedRoutes = ["/admin"];
const publicRoutes = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow public routes (login page)
  const isPublicRoute = publicRoutes.some((route) => path === route);
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || (path.startsWith(route + "/") && !isPublicRoute)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    // Verify the current session — this will throw if expired or invalid
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
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
      .sign(encodedKey);

    const response = NextResponse.next();
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch {
    // Expired or invalid session — clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/admin/login?expired=1", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
