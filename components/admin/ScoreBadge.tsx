// Hot / Warm / Cold lead score, used in the leads table, dashboard and insights panel.
export type ScoreLabel = "hot" | "warm" | "cold";

const STYLES: Record<ScoreLabel, string> = {
  hot: "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200",
  warm: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  cold: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export default function ScoreBadge({ label, points, size = "sm" }: { label: ScoreLabel; points?: number; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${STYLES[label]} ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {label}
      {points !== undefined && <span className="font-medium normal-case tabular-nums opacity-80">{points}</span>}
    </span>
  );
}
