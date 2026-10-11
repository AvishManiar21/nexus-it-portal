"use client";

import Link from "next/link";
import { login, LoginState } from "@/app/actions/auth";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/site/Logo";

function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5" aria-label="Nexus IT Solutions home">
        <Logo />
        <span className="font-heading text-lg font-semibold text-ink">Nexus IT Solutions</span>
      </Link>

      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Access the lead management dashboard.</p>

        <form action={action} className="mt-6 space-y-5">
          {expired && !state?.error && (
            <div role="status" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session expired due to inactivity. Please sign in again.
            </div>
          )}
          {state?.error && (
            <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
          </div>

          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field-input" />
          </div>

          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <Link href="/" className="mt-6 text-sm text-muted hover:text-ink">&larr; Back to website</Link>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
