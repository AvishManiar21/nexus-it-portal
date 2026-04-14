import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import LeadTable from "@/components/LeadTable";
import Link from "next/link";

export default async function LeadsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-1">Lead Management</h1>
      <p className="text-zinc-500 mb-8">
        Search, sort, and manage all leads in one place.
      </p>
      <LeadTable />
    </div>
  );
}
