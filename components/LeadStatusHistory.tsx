"use client";

import StatusBadge from "@/components/admin/StatusBadge";

interface StatusChange {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

interface LeadStatusHistoryProps {
  statusHistory: StatusChange[];
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

export default function LeadStatusHistory({
  statusHistory,
}: LeadStatusHistoryProps) {
  if (statusHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-line">
        <div className="p-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">
            Status Change History
          </h2>
        </div>
        <div className="p-4 text-sm text-muted">No status changes yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-line">
      <div className="p-4 border-b border-line">
        <h2 className="text-lg font-semibold text-ink">
          Status Change History
        </h2>
      </div>
      <div className="divide-y divide-line">
        {statusHistory.map((change) => (
          <div key={change.id} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={change.old_status} />
              <span className="text-muted" aria-label="changed to">→</span>
              <StatusBadge status={change.new_status} />
            </div>
            <p className="text-xs text-muted mt-1">
              {change.changed_by} &middot; {formatDateTime(change.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
