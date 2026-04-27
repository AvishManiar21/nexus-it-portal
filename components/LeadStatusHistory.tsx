"use client";

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
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status Change History
          </h2>
        </div>
        <div className="p-4 text-sm text-gray-500">No status changes yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Status Change History
        </h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {statusHistory.map((change) => (
          <div key={change.id} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-red-100 text-red-800 line-through">
                {change.old_status}
              </span>
              <span className="text-gray-400">→</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-green-100 text-green-800">
                {change.new_status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {change.changed_by} &middot; {formatDateTime(change.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
