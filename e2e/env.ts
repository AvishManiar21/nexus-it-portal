// Values for the e2e server only. The secret signs throwaway test sessions and
// is not used anywhere else; the backend URL deliberately has nothing behind it.
export const E2E_SESSION_SECRET = "e2e-only-session-secret-not-used-anywhere-else";
export const E2E_BACKEND_URL = "http://127.0.0.1:8999";
