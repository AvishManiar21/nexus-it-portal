import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || "nexus-it-session-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

// Inactivity timeout in minutes — session expires after this much idle time
export const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TIMEOUT_MINUTES}m`)
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function createSession(user: { id: string; email: string; name: string }) {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
  const session = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set("session", session, cookieOptions(expiresAt));
}

/**
 * Refresh the session with a new expiry time (sliding window).
 * Called on every authenticated request to reset the inactivity clock.
 */
export async function refreshSession() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("session")?.value;
  const session = await decrypt(sessionValue);
  if (!session) return null;

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
  const newToken = await encrypt({
    userId: session.userId,
    email: session.email,
    name: session.name,
    expiresAt,
  });
  cookieStore.set("session", newToken, cookieOptions(expiresAt));
  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return decrypt(session);
}
