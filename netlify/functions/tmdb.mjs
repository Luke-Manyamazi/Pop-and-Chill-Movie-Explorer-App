const TMDB_BASE = 'https://api.themoviedb.org/3';

const allowedMethods = new Set(['GET']);

export default async function handler(request) {
  if (!allowedMethods.has(request.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { Allow: 'GET', 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'TMDB API is not configured on the server.' }, { status: 500 });
  }

  const url = new URL(request.url);
  const requestedPath = url.searchParams.get('path') || '';

  if (!requestedPath.startsWith('/') || requestedPath.includes('..') || requestedPath.includes('://')) {
    return Response.json({ error: 'Invalid TMDB path.' }, { status: 400 });
  }

  const params = new URLSearchParams(url.searchParams);
  params.delete('path');
  params.set('api_key', apiKey);

  const response = await fetch(`${TMDB_BASE}${requestedPath}?${params.toString()}`);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
