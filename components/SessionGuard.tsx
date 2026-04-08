"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// Must match the server-side SESSION_TIMEOUT_MINUTES in app/lib/session.ts
const TIMEOUT_MINUTES = 15;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
// Show a warning 2 minutes before expiry
const WARNING_MS = 2 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export default function SessionGuard() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleExpiry = useCallback(() => {
    // Force navigate to login with expired flag
    window.location.href = "/admin/login?expired=1";
  }, []);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);

    // Set warning timer (fires 2 min before expiry)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS - WARNING_MS);

    // Set expiry timer
    timerRef.current = setTimeout(handleExpiry, TIMEOUT_MS);
  }, [handleExpiry]);

  useEffect(() => {
    // Start timers on mount
    resetTimers();

    // Reset timers on any user activity
    const onActivity = () => resetTimers();
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
  }, [resetTimers]);

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
