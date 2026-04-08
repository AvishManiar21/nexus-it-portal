import { refreshSession, deleteSession, getSession } from "@/app/lib/session";

/**
 * GET /api/session — check if the current session is still valid.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ valid: false }, { status: 401 });
  }
  return Response.json({ valid: true });
}

/**
 * POST /api/session — refresh the session (sliding window).
 * Called by SessionGuard on user activity to keep the server session in sync.
 */
export async function POST() {
  const session = await refreshSession();
  if (!session) {
    return Response.json({ valid: false }, { status: 401 });
  }
  return Response.json({ valid: true });
}

/**
 * DELETE /api/session — explicitly delete the session on expiry.
 */
export async function DELETE() {
  await deleteSession();
  return Response.json({ ok: true });
}
