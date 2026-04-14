import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Link
          href="/admin/leads"
          className="block p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold mb-1">Lead Management</h2>
          <p className="text-sm text-zinc-500">
            Search, sort, and manage all leads.
          </p>
        </Link>
      </div>
    </div>
  );
}
