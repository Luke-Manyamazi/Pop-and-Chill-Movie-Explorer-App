const TMDB_BASE = 'https://api.themoviedb.org/3';

const allowedMethods = new Set(['GET']);

export default async function handler(event) {
  if (!allowedMethods.has(event.httpMethod)) {
    return { statusCode: 405, headers: { Allow: 'GET' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TMDB API is not configured on the server.' }) };
  }

  const requestedPath = event.queryStringParameters?.path || '';
  if (!requestedPath.startsWith('/') || requestedPath.includes('..') || requestedPath.includes('://')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid TMDB path.' }) };
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
    if (key !== 'path' && value != null) params.set(key, value);
  }
  params.set('api_key', apiKey);

  const response = await fetch(`${TMDB_BASE}${requestedPath}?${params.toString()}`);
  const body = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
    body,
  };
}

export { handler };
