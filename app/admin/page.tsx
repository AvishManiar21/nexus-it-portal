import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            Welcome back, {session.name} ({session.email})
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
      <p className="text-gray-500">This is a placeholder for the Admin dashboard.</p>
    </div>
  );
}
