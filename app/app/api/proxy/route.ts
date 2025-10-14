import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL;

  if (!studioUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_STUDIO_URL is not defined' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await fetch(studioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: headers,
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
