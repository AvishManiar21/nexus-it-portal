import { BACKEND_API_URL } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server"
import { forwardedForHeaders } from "@/app/lib/forwardedFor"


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_API_URL}/leads/submit-contact`, {
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
