"use client";

import { BACKEND_API_URL } from "@/lib/backend";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ScoreBadge from "@/components/admin/ScoreBadge";
import type { LeadScoreSummary } from "@/lib/api";

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  status: string;
  created_at: string;
}

// "score" is sorted in the browser; the others are sorted by the API
type SortColumn = "name" | "email" | "company" | "status" | "created_at" | "score";

const API_URL = BACKEND_API_URL;

export default function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortColumn>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<number, LeadScoreSummary>>({});

  // Rules-based scores for all leads (one request); the table works without them
  useEffect(() => {
    fetch(`${API_URL}/leads/scores`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: LeadScoreSummary[]) => setScores(Object.fromEntries(rows.map((r) => [r.lead_id, r]))))
      .catch((err) => console.error("Failed to fetch lead scores:", err));
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "all") params.set("status_filter", statusFilter);
    params.set("sort_by", sortBy === "score" ? "created_at" : sortBy);
    params.set("sort_order", sortOrder);

    try {
      const res = await fetch(`${API_URL}/leads/?${params.toString()}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLeads();
    }, 200);
    return () => clearTimeout(debounce);
  }, [fetchLeads]);

  function handleSort(column: SortColumn) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "score" ? "desc" : "asc"); // hottest first
    }
  }

  function sortIndicator(column: SortColumn) {
    if (sortBy !== column) return "";
    return sortOrder === "asc" ? " \u25B2" : " \u25BC";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const columns: { key: SortColumn; label: string }[] = [
    { key: "score", label: "Score" },
    { key: "company", label: "Company Name" },
    { key: "name", label: "Contact Person" },
    { key: "email", label: "Email" },
    { key: "status", label: "Lead Status" },
    { key: "created_at", label: "Creation Date" },
  ];

  const rows =
    sortBy === "score"
      ? [...leads].sort((a, b) => {
          const diff = (scores[a.id]?.points ?? -1) - (scores[b.id]?.points ?? -1);
          return sortOrder === "asc" ? diff : -diff;
        })
      : leads;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <label htmlFor="lead-search" className="sr-only">Search leads</label>
        <input
          id="lead-search"
          type="search"
          placeholder="Search by company, contact or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input max-w-md flex-1 min-w-[240px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter leads by status"
          className="field-input w-auto cursor-pointer"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-canvas">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortBy === col.key ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                  className="px-5 py-3 text-left"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
                  >
                    {col.label}
                    <span aria-hidden="true">{sortIndicator(col.key)}</span>
                  </button>
                </th>
              ))}
              <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">Loading leads…</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">
                  {search ? "No leads match your search." : "No leads found."}
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-canvas">
                  <td className="px-5 py-3.5">
                    {scores[lead.id] ? (
                      <ScoreBadge label={scores[lead.id].label} points={scores[lead.id].points} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-ink hover:text-brand">
                      {lead.company || "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{lead.name}</td>
                  <td className="px-5 py-3.5 text-muted">{lead.email}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={lead.status} /></td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(lead.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      aria-label={`View ${lead.name}`}
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover"
                    >
                      View <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && leads.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}