"use client"

import { BACKEND_API_URL } from "@/lib/backend"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, RefreshCw } from "lucide-react"
import StatusBadge from "@/components/admin/StatusBadge"

interface Lead {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  source: string
  status: string
  created_at: string
}

interface ContactMessage {
  id: string
  lead_id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

interface DashboardMetrics {
  total_leads: number
  new_leads_this_week: number
  most_viewed_product: {
    product_id: number | null
    name: string | null
    view_count: number
  }
  completion_rates_by_product: Array<{
    product_id: number
    name: string
    starts: number
    completes: number
    completion_rate: number
  }>
  total_contact_messages: number
  total_rfd_submissions: number
  conversion_rate: number
  leads_by_source: Array<{
    source: string
    count: number
  }>
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/session")
        if (!response.ok) {
          router.push("/admin/login")
          return
        }
      } catch {
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [leadsRes, messagesRes] = await Promise.all([
          fetch(`${BACKEND_API_URL}/leads/`, { credentials: 'include' }),
          fetch(`${BACKEND_API_URL}/leads/contact-messages`, { credentials: 'include' })
        ])

        if (leadsRes.ok) {
          const leadsData = await leadsRes.json()
          setLeads(leadsData)
        }

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          setContactMessages(messagesData)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true)
      setMetricsError("")
      const res = await fetch(`${BACKEND_API_URL}/analytics/dashboard`, {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data: DashboardMetrics = await res.json()
      setMetrics(data)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setMetricsError("Failed to load analytics metrics")
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const demoRequests = leads.filter((lead) => lead.source === "RFD Form")

  const kpis = [
    { label: "Total leads", value: metrics?.total_leads ?? 0 },
    { label: "New this week", value: metrics?.new_leads_this_week ?? 0 },
    { label: "Demo requests", value: metrics?.total_rfd_submissions ?? 0 },
    { label: "Conversion rate", value: `${Math.round((metrics?.conversion_rate ?? 0) * 100)}%`, hint: "Contacted or converted" },
  ]

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1">Leads, engagement and enquiries at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          {metricsError && <span className="text-sm text-red-700">{metricsError}</span>}
          <button type="button" onClick={fetchMetrics} disabled={metricsLoading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${metricsLoading ? "animate-spin" : ""}`} aria-hidden />
            {metricsLoading ? "Refreshing" : "Refresh"}
          </button>
          <Link href="/admin/leads" className="btn btn-primary">
            All leads
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-900">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-line bg-white p-5">
            <p className="text-sm font-medium text-muted">{kpi.label}</p>
            {metricsLoading ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-ink">{kpi.value}</p>
            )}
            {kpi.hint && <p className="mt-1 text-xs text-muted">{kpi.hint}</p>}
          </div>
        ))}
      </div>

      {/* Engagement */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Most-viewed solution">
          <div className="p-5">
            {metricsLoading ? (
              <>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="mt-2 h-4 w-20" />
              </>
            ) : (
              <>
                <p className="font-heading text-xl font-semibold text-ink">{metrics?.most_viewed_product?.name ?? "No views yet"}</p>
                <p className="mt-1 text-sm text-muted">{metrics?.most_viewed_product?.view_count ?? 0} page views</p>
              </>
            )}
          </div>
        </Card>

        <Card title="Demo video completion">
          <div className="space-y-4 p-5">
            {metricsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : metrics?.completion_rates_by_product?.length ? (
              metrics.completion_rates_by_product.map((p) => {
                const pct = Math.round((p.completion_rate || 0) * 100)
                return (
                  <div key={p.product_id}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate text-ink">{p.name}</span>
                      <span className="font-semibold tabular-nums text-ink">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="presentation">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{p.completes} of {p.starts} who started finished</p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted">No demo video data yet.</p>
            )}
          </div>
        </Card>

        <Card title="Leads by source">
          <div className="p-5">
            {metricsLoading ? (
              <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : metrics?.leads_by_source?.length ? (
              <dl className="divide-y divide-line">
                {metrics.leads_by_source.map((source) => (
                  <div key={source.source} className="flex justify-between py-2 text-sm first:pt-0 last:pb-0">
                    <dt>{source.source}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{source.count}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">No leads yet.</p>
            )}
            <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
              {metrics?.total_contact_messages ?? 0} contact messages in total
            </p>
          </div>
        </Card>
      </div>

      {/* Demo requests */}
      <div className="mt-6">
        <Card
          title="Demo requests"
          action={<Link href="/admin/leads" className="text-sm font-semibold text-brand hover:text-brand-hover">View all leads</Link>}
        >
          {isLoading ? (
            <p className="p-5 text-sm text-muted">Loading…</p>
          ) : demoRequests.length === 0 ? (
            <p className="p-5 text-sm text-muted">No demo requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3">Contact</th>
                    <th scope="col" className="px-5 py-3">Company</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3">Received</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {demoRequests.map((lead) => (
                    <tr key={lead.id} className="hover:bg-canvas">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-ink hover:text-brand">
                          {lead.name}
                        </Link>
                        <p className="text-muted">{lead.email}</p>
                      </td>
                      <td className="px-5 py-3.5">{lead.company || "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={lead.status} /></td>
                      <td className="px-5 py-3.5 text-muted">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover"
                          aria-label={`View ${lead.name}`}
                        >
                          View <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Contact messages */}
      <div className="mt-6">
        <Card title="Contact messages">
          {isLoading ? (
            <p className="p-5 text-sm text-muted">Loading…</p>
          ) : contactMessages.length === 0 ? (
            <p className="p-5 text-sm text-muted">No contact messages yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {contactMessages.map((message) => (
                <li key={message.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{message.subject}</h3>
                      <p className="mt-0.5 text-sm text-muted">
                        From{" "}
                        <Link href={`/admin/leads/${message.lead_id}`} className="font-medium text-brand hover:text-brand-hover">
                          {message.name}
                        </Link>{" "}
                        · {message.email}
                      </p>
                    </div>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{message.message}</p>
                  <p className="mt-2 text-xs text-muted">{new Date(message.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
