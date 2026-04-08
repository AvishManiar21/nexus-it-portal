"use server";

import { createSession, deleteSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

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
