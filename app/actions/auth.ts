"use server";

import { createSession, deleteSession } from "@/app/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND_SERVER_URL } from "@/lib/backend";
import { forwardedForHeaders } from "@/app/lib/forwardedFor";

const API_URL = BACKEND_SERVER_URL;

export type LoginState = {
  error?: string;
} | undefined;

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardedForHeaders(await headers()) },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      return { error: "Too many login attempts. Please wait a minute and try again." };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { error: data?.detail || "Invalid email or password." };
    }

    const data = await res.json();
    await createSession(data.user);
  } catch {
    return { error: "Unable to connect to the server. Please try again." };
  }

  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
