import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL;

  if (!studioUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_STUDIO_URL is not defined' }, { status: 500 });
  }

  try {
    // Forward the raw JSON body without re-encoding, to avoid encoding/header mismatches
    const raw = await request.text();
    const response = await fetch(studioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: raw,
    });

    // Clone upstream headers but remove content-encoding/length since body is passed-through
    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.delete('Content-Encoding');
    headers.delete('content-length');
    headers.delete('Content-Length');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const headers = new Headers(request.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 204, headers: headers });
}
