import { NextRequest, NextResponse } from "next/server"

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward to Python backend for event logging
    const response = await fetch(`${PYTHON_API_URL}/engagement/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      // Return success anyway to not interrupt user experience
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    // Silently fail to not interrupt user experience
    console.error("Engagement tracking error:", error)
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
