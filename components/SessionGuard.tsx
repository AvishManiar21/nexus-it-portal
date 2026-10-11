"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// Must match the server-side SESSION_TIMEOUT_MINUTES in app/lib/session.ts
const TIMEOUT_MINUTES = 15;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
// Show a warning 2 minutes before expiry
const WARNING_MS = 2 * 60 * 1000;
// Throttle server-side session refreshes to once per minute
const REFRESH_THROTTLE_MS = 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export default function SessionGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  // Set on mount (not during render) so the first refresh still waits a full throttle window
  const lastRefreshRef = useRef<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  const handleExpiry = useCallback(async () => {
    // Delete the server-side session cookie before redirecting
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // Redirect regardless — middleware will catch invalid sessions
    }
    window.location.href = "/admin/login?expired=1";
  }, []);

  const refreshServerSession = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return;
    lastRefreshRef.current = now;

    // Fire-and-forget: refresh the server session so it stays in sync
    // with client-side activity. If it fails (session already expired),
    // the expiry timer or next navigation will handle the redirect.
    fetch("/api/session", { method: "POST" }).catch(() => {});
  }, []);

  const startTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Refresh the server session on activity (throttled)
    refreshServerSession();

    // Set warning timer (fires 2 min before expiry)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS - WARNING_MS);

    // Set expiry timer
    timerRef.current = setTimeout(handleExpiry, TIMEOUT_MS);
  }, [handleExpiry, refreshServerSession]);

  useEffect(() => {
    lastRefreshRef.current = Date.now();
    // The warning starts hidden, so mount only needs the timers
    startTimers();

    const onActivity = () => {
      setShowWarning(false);
      startTimers();
    };
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [startTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl bg-amber-50 border border-amber-300 p-4 shadow-lg">
      <p className="text-sm font-medium text-amber-800">
        Your session will expire in 2 minutes due to inactivity.
      </p>
      <p className="mt-1 text-xs text-amber-600">
        Move your mouse or press any key to stay signed in.
      </p>
    </div>
  );
}
