// Shared by app/lib/session.ts and proxy.ts so both sign/verify with the same key.
// Kept free of "server-only" and next/headers so it can be imported from the proxy.

const MIN_SECRET_LENGTH = 32;

let cachedKey: Uint8Array | null = null;

/**
 * Return the HS256 key used for admin session JWTs.
 * Throws if SESSION_SECRET is missing or too short — there is deliberately
 * no fallback, since a known default would let anyone forge an admin session.
 * Resolved lazily so `next build` does not require the secret.
 */
export function getSessionKey(): Uint8Array {
  if (cachedKey) return cachedKey;

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set to a random string of at least ${MIN_SECRET_LENGTH} characters ` +
        "(e.g. `openssl rand -base64 32`). It must match the backend's SESSION_SECRET."
    );
  }

  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}
