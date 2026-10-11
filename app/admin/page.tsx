"use client"

import { BACKEND_API_URL } from "@/lib/backend";
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/app/actions/auth"
import Link from "next/link"

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage leads and customer inquiries</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/admin/leads"
            className="inline-block px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Search &amp; Sort All Leads
          </Link>
        </div>

        {/* Analytics Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <div className="flex items-center gap-4">
              {metricsError && (
                <span className="text-sm text-red-600">{metricsError}</span>
              )}
              <button
                onClick={fetchMetrics}
                disabled={metricsLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {metricsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total Leads */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              {metricsLoading ? (
                <div className="mt-2 h-9 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics?.total_leads ?? 0}
                </p>
              )}
            </div>

            {/* New Leads (Last 7 Days) */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">New Leads (Last 7 Days)</p>
              {metricsLoading ? (
                <div className="mt-2 h-9 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics?.new_leads_this_week ?? 0}
                </p>
              )}
            </div>

            {/* Most-Viewed Product */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Most-Viewed Product</p>
              {metricsLoading ? (
                <>
                  <div className="mt-2 h-9 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="mt-2 h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 mt-2 break-words">
                    {metrics?.most_viewed_product?.name ?? "—"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {metrics?.most_viewed_product?.view_count ?? 0} views
                  </p>
                </>
              )}
            </div>

            {/* Demo Completion Rate */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Demo Completion Rate</p>
              {metricsLoading ? (
                <div className="mt-3 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : metrics?.completion_rates_by_product?.length ? (
                <div className="mt-3 space-y-3">
                  {metrics.completion_rates_by_product.map((p) => {
                    const pct = Math.round((p.completion_rate || 0) * 100)
                    return (
                      <div key={p.product_id}>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span className="truncate pr-2">{p.name}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-2 bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No demo data yet</p>
              )}
            </div>
          </div>

          {/* Second Row - Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
            {/* Total Contact Messages */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Contact Messages</p>
              {metricsLoading ? (
                <div className="mt-2 h-9 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics?.total_contact_messages ?? 0}
                </p>
              )}
            </div>

            {/* Total RFD Submissions */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Demo Requests</p>
              {metricsLoading ? (
                <div className="mt-2 h-9 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics?.total_rfd_submissions ?? 0}
                </p>
              )}
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Lead Conversion Rate</p>
              {metricsLoading ? (
                <div className="mt-2 h-9 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {Math.round((metrics?.conversion_rate ?? 0) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Contacted or Converted</p>
                </>
              )}
            </div>

            {/* Leads by Source */}
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex flex-col">
              <p className="text-sm font-medium text-gray-600">Leads by Source</p>
              {metricsLoading ? (
                <div className="mt-3 space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : metrics?.leads_by_source?.length ? (
                <div className="mt-3 space-y-2">
                  {metrics.leads_by_source.map((source) => (
                    <div key={source.source} className="flex justify-between text-sm">
                      <span className="text-gray-700">{source.source}</span>
                      <span className="font-medium text-gray-900">{source.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* RFD Leads & Demo Submissions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Demo Requests (RFD)</h2>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No demo requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Company</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.filter(lead => lead.source === "RFD Form").map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.company || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          lead.status === "new"
                            ? "bg-green-100 text-green-800"
                            : lead.status === "contacted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact Messages */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Contact Form Submissions</h2>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : contactMessages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No contact submissions yet</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contactMessages.map((message) => (
                <div key={message.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                      <p className="text-sm text-gray-600">
                        From: <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
                          {message.name} ({message.email})
                        </a>
                      </p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      message.status === "new"
                        ? "bg-green-100 text-green-800"
                        : message.status === "read"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {message.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{message.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
