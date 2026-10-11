import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchLeadInsights, fetchLeadProfile } from "@/lib/api";
import LeadInsights from "@/components/LeadInsights";
import LeadNotes from "@/components/LeadNotes";
import LeadStatusSelector from "@/components/LeadStatusSelector";
import LeadStatusHistory from "@/components/LeadStatusHistory";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  pending: "bg-orange-100 text-orange-800",
  read: "bg-gray-100 text-gray-800",
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TIMELINE_COLORS: Record<string, string> = {
  "Page View": "bg-indigo-500",
  "Demo Video": "bg-emerald-500",
  "RFD Submission": "bg-orange-500",
};

export default async function LeadProfilePage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [profile, insights] = await Promise.all([
    fetchLeadProfile(Number(id)),
    fetchLeadInsights(Number(id)),
  ]);

  if (!profile) {
    notFound();
  }

  const { lead, rfd_submissions, contact_messages, timeline, notes, status_history } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/admin/leads"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            &larr; Back to Lead Management
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {lead.name}
              </h1>
              {lead.company && (
                <p className="text-lg text-gray-600 dark:text-zinc-400 mt-1">
                  {lead.company}
                </p>
              )}
            </div>
            <LeadStatusSelector
              leadId={lead.id}
              currentStatus={lead.status}
            />
          </div>

          {/* Contact Details */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Email
              </p>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {lead.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Phone
              </p>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {lead.phone}
                </a>
              ) : (
                <p className="text-sm text-gray-400">--</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Budget Range
              </p>
              <p className="text-sm text-gray-900 dark:text-zinc-300">
                {lead.budget || "--"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Source
              </p>
              <p className="text-sm text-gray-900 dark:text-zinc-300">
                {lead.source || "--"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Lead Since
              </p>
              <p className="text-sm text-gray-900 dark:text-zinc-300">
                {formatDate(lead.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Rules-based score + AI-written summary and follow-up draft */}
        <LeadInsights leadId={lead.id} leadEmail={lead.email} initial={insights} />

        {/* Two-column layout for submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* RFD Submissions */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                RFD Submissions
              </h2>
            </div>
            {rfd_submissions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No RFD submissions
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {rfd_submissions.map((rfd) => (
                  <div key={rfd.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rfd.products?.name || `Product #${rfd.product_id}`}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[rfd.status] ||
                          "bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        {rfd.status}
                      </span>
                    </div>
                    {rfd.message && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">
                        {rfd.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDateTime(rfd.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Messages */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contact Messages
              </h2>
            </div>
            {contact_messages.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No contact messages
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {contact_messages.map((msg) => (
                  <div key={msg.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {msg.subject}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[msg.status] ||
                          "bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">
                      {msg.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity Timeline
            </h2>
          </div>
          {timeline.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No activity recorded
            </div>
          ) : (
            <div className="p-4">
              <div className="relative border-l-2 border-gray-200 dark:border-zinc-700 ml-3">
                {timeline.map((event, idx) => (
                  <div key={idx} className="mb-6 ml-6 relative last:mb-0">
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${TIMELINE_COLORS[event.type] || "bg-blue-500"}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.type}
                      </p>
                      {event.details && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                          {event.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(event.occurred_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Change History */}
        <LeadStatusHistory statusHistory={status_history || []} />

        {/* Internal Notes */}
        <LeadNotes leadId={lead.id} initialNotes={notes} />
      </div>
    </div>
  );
}
