"use client";

import { useState } from "react";
import { BACKEND_API_URL } from "@/lib/backend";
import type { LeadInsights as Insights } from "@/lib/api";

const SCORE_STYLES: Record<Insights["score"]["label"], string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-amber-100 text-amber-800",
  cold: "bg-slate-100 text-slate-700",
};

export default function LeadInsights({
  leadId,
  leadEmail,
  initial,
}: {
  leadId: number;
  leadEmail: string;
  initial: Insights | null;
}) {
  const [data, setData] = useState<Insights | null>(initial);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_API_URL}/leads/${leadId}/insights`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 503) {
        setError("The AI model is not available. Make sure Ollama is running and the configured model is pulled.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Could not generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmail = async () => {
    if (!data?.insight) return;
    await navigator.clipboard.writeText(`Subject: ${data.insight.email_subject}\n\n${data.insight.email_body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-line p-4 mb-6 text-sm text-muted">
        Lead insights are unavailable right now.
      </div>
    );
  }

  const { score, insight, stale } = data;
  const mailto = insight
    ? `mailto:${leadEmail}?subject=${encodeURIComponent(insight.email_subject)}&body=${encodeURIComponent(insight.email_body)}`
    : "";

  return (
    <section aria-labelledby="insights-heading" className="bg-white rounded-lg border border-line mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-line">
        <h2 id="insights-heading" className="text-lg font-semibold text-ink">
          Lead insights
        </h2>
        <button
          type="button"
          onClick={generate}
          disabled={isGenerating}
          className="btn btn-primary min-h-10 px-4 py-2 text-[15px]"
        >
          {isGenerating ? "Generating…" : insight ? "Regenerate AI summary" : "Generate AI summary"}
        </button>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Rules-based score: always live, never decided by the model */}
        <div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${SCORE_STYLES[score.label]}`}>
              {score.label}
            </span>
            <span className="text-sm text-body">{score.points} points</span>
          </div>
          {score.breakdown.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No engagement signals yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {score.breakdown.map((item) => (
                <li key={item.reason} className="flex gap-2 text-body">
                  <span className="w-9 shrink-0 text-right font-mono text-muted">+{item.points}</span>
                  <span>{item.reason}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Score is calculated from engagement rules, not by AI.</p>
        </div>

        {/* AI-written text */}
        <div aria-live="polite">
          {isGenerating && (
            <p className="text-sm text-body">
              Writing a summary with the local model. This can take up to a minute…
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {!insight && !isGenerating && !error && (
            <p className="text-sm text-body">
              Generate an AI summary, a suggested next step and a draft follow-up email for this lead.
            </p>
          )}
          {insight && !isGenerating && (
            <div className="space-y-4">
              {stale && (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  New activity since this summary was generated. Regenerate to include it.
                </p>
              )}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Summary</h3>
                <p className="mt-1 text-sm text-ink">{insight.summary}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Suggested next step</h3>
                <p className="mt-1 text-sm text-ink">{insight.next_step}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Draft follow-up email</h3>
                <div className="mt-1 rounded-md border border-line p-3 text-sm">
                  <p className="font-medium text-ink">{insight.email_subject}</p>
                  <p className="mt-2 whitespace-pre-wrap text-body">{insight.email_body}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-canvas"
                  >
                    {copied ? "Copied" : "Copy email"}
                  </button>
                  <a
                    href={mailto}
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-canvas"
                  >
                    Open in mail app
                  </a>
                </div>
              </div>
              <p className="text-xs text-muted">
                AI-written draft ({insight.model}, {new Date(insight.generated_at).toLocaleString()}). Review before sending.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
