import { NextRequest, NextResponse } from "next/server"
import { forwardedForHeaders } from "@/app/lib/forwardedFor"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${PYTHON_API_URL}/leads/submit-contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardedForHeaders(request.headers),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Contact submission error:", error)
    return NextResponse.json(
      { detail: "Failed to process contact submission" },
      { status: 500 }
    )
  }
}
