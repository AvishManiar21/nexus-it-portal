import { BACKEND_API_URL } from "@/lib/backend";
import { NextRequest, NextResponse } from 'next/server';
import { forwardedForHeaders } from '@/app/lib/forwardedFor';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_API_URL}/leads/submit-rfd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardedForHeaders(request.headers),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || 'Failed to submit RFD' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
