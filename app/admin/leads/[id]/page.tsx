import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchLeadInsights, fetchLeadProfile } from "@/lib/api";
import LeadInsights from "@/components/LeadInsights";
import LeadNotes from "@/components/LeadNotes";
import LeadStatusSelector from "@/components/LeadStatusSelector";
import LeadStatusHistory from "@/components/LeadStatusHistory";
import StatusBadge from "@/components/admin/StatusBadge";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

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

// Brand color marks high-intent events; page views stay neutral
const TIMELINE_COLORS: Record<string, string> = {
  "Page View": "bg-slate-400",
  "Demo Video": "bg-brand",
  "RFD Submission": "bg-brand",
};

const TIMELINE_VISIBLE = 8;

function TimelineItem({ event }: { event: { type: string; details: string | null; occurred_at: string } }) {
  return (
    <li className="relative mb-5 ml-6 last:mb-0">
      <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${TIMELINE_COLORS[event.type] || "bg-brand"}`} />
      <p className="text-sm font-medium text-ink">{event.type}</p>
      {event.details && <p className="text-sm text-body">{event.details}</p>}
      <p className="mt-1 text-xs text-muted">{formatDateTime(event.occurred_at)}</p>
    </li>
  );
}

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

  // Newest first; long histories show the latest events and fold the rest
  const newestFirst = [...timeline].reverse();
  const recentEvents = newestFirst.slice(0, TIMELINE_VISIBLE);
  const olderEvents = newestFirst.slice(TIMELINE_VISIBLE);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-5xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All leads
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-line p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {lead.name}
              </h1>
              {lead.company && (
                <p className="text-lg text-body mt-1">
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
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Email
              </p>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-brand hover:underline"
              >
                {lead.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Phone
              </p>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm text-brand hover:underline"
                >
                  {lead.phone}
                </a>
              ) : (
                <p className="text-sm text-muted">--</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Budget Range
              </p>
              <p className="text-sm text-ink">
                {lead.budget || "--"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Source
              </p>
              <p className="text-sm text-ink">
                {lead.source || "--"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Lead Since
              </p>
              <p className="text-sm text-ink">
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
          <div className="bg-white rounded-lg border border-line">
            <div className="p-4 border-b border-line">
              <h2 className="text-lg font-semibold">
                RFD Submissions
              </h2>
            </div>
            {rfd_submissions.length === 0 ? (
              <div className="p-4 text-sm text-muted">
                No RFD submissions
              </div>
            ) : (
              <div className="divide-y divide-line">
                {rfd_submissions.map((rfd) => (
                  <div key={rfd.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-ink">
                        {rfd.products?.name || `Product #${rfd.product_id}`}
                      </p>
                      <StatusBadge status={rfd.status} />
                    </div>
                    {rfd.message && (
                      <p className="text-sm text-body mb-1">
                        {rfd.message}
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      {formatDateTime(rfd.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Messages */}
          <div className="bg-white rounded-lg border border-line">
            <div className="p-4 border-b border-line">
              <h2 className="text-lg font-semibold">
                Contact Messages
              </h2>
            </div>
            {contact_messages.length === 0 ? (
              <div className="p-4 text-sm text-muted">
                No contact messages
              </div>
            ) : (
              <div className="divide-y divide-line">
                {contact_messages.map((msg) => (
                  <div key={msg.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-ink">
                        {msg.subject}
                      </p>
                      <StatusBadge status={msg.status} />
                    </div>
                    <p className="text-sm text-body mb-1">
                      {msg.message}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg border border-line mb-6">
          <div className="p-4 border-b border-line">
            <h2 className="text-lg font-semibold">
              Activity Timeline
            </h2>
          </div>
          {timeline.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No activity recorded
            </div>
          ) : (
            <div className="p-4">
              <ol className="relative ml-3 border-l-2 border-line">
                {recentEvents.map((event, idx) => (
                  <TimelineItem key={idx} event={event} />
                ))}
              </ol>
              {olderEvents.length > 0 && (
                <details className="group mt-2">
                  <summary className="ml-3 cursor-pointer list-none pl-6 text-sm font-semibold text-brand hover:text-brand-hover [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Show {olderEvents.length} earlier events</span>
                    <span className="hidden group-open:inline">Hide earlier events</span>
                  </summary>
                  <ol className="relative ml-3 mt-4 border-l-2 border-line">
                    {olderEvents.map((event, idx) => (
                      <TimelineItem key={idx} event={event} />
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Status Change History */}
          <LeadStatusHistory statusHistory={status_history || []} />

          {/* Internal Notes */}
          <LeadNotes leadId={lead.id} initialNotes={notes} />
        </div>
      </div>
    </div>
  );
}
