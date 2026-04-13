"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/app/actions/auth"

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

const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"

export default function AdminPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/session")
        if (!response.ok) {
          router.push("/admin/login")
          return
        }
      } catch (err) {
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
          fetch(`${PYTHON_API_URL}/leads/`),
          fetch(`${PYTHON_API_URL}/leads/contact-messages`)
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{leads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Contact Messages</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{contactMessages.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">New Messages</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {contactMessages.filter(m => m.status === "new").length}
            </p>
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
                  {leads.map((lead) => (
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
