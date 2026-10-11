// One badge style for lead, demo request and message statuses across the admin area.
const STYLES: Record<string, string> = {
  new: "bg-brand-soft text-brand",
  contacted: "bg-amber-50 text-amber-800",
  converted: "bg-green-50 text-green-800",
  pending: "bg-amber-50 text-amber-800",
  read: "bg-slate-100 text-slate-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STYLES[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
