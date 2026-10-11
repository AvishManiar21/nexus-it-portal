import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import LeadTable from "@/components/LeadTable";

export default async function LeadsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-semibold">Leads</h1>
      <p className="mt-1">Search, sort and open any lead to see its activity and AI insights.</p>
      <div className="mt-8">
        <LeadTable />
      </div>
    </div>
  );
}
