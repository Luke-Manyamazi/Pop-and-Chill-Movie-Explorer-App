const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid session token.');

  const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
  return { header, payload, signingInput: `${parts[0]}.${parts[1]}`, signature: base64UrlToBytes(parts[2]) };
}

const jwksCache = new Map();

async function getSigningKey(issuer, kid) {
  const cached = jwksCache.get(issuer);
  const keys = cached && Date.now() - cached.timestamp < 10 * 60 * 1000
    ? cached.keys
    : await fetch(`${issuer}/.well-known/jwks.json`).then(async response => {
        if (!response.ok) throw new Error('Could not load authentication keys.');
        const data = await response.json();
        jwksCache.set(issuer, { keys: data.keys || [], timestamp: Date.now() });
        return data.keys || [];
      });

  return keys.find(key => key.kid === kid && key.kty === 'RSA');
}

async function verifyClerkToken(token) {
  const decoded = decodeJwt(token);
  const issuer = decoded.payload.iss?.replace(/\/$/, '');
  const configuredIssuer = process.env.CLERK_ISSUER_URL?.replace(/\/$/, '');

  if (!issuer || !issuer.startsWith('https://')) throw new Error('Invalid token issuer.');
  if (configuredIssuer && issuer !== configuredIssuer) throw new Error('Invalid token issuer.');

  const hostname = new URL(issuer).hostname;
  if (!configuredIssuer && !hostname.endsWith('.clerk.accounts.dev') && !hostname.endsWith('.clerk.com')) {
    throw new Error('Invalid token issuer.');
  }

  const key = await getSigningKey(issuer, decoded.header.kid);
  if (!key) throw new Error('Authentication key not found.');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    decoded.signature,
    new TextEncoder().encode(decoded.signingInput),
  );

  if (!valid) throw new Error('Invalid session token.');

  const now = Math.floor(Date.now() / 1000);
  if (!decoded.payload.sub || (decoded.payload.exp && decoded.payload.exp <= now) || (decoded.payload.nbf && decoded.payload.nbf > now)) {
    throw new Error('Expired or invalid session.');
  }

  return decoded.payload.sub;
}

async function supabaseRequest(path, options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase request failed with ${response.status}`);
  }
  return text ? JSON.parse(text) : [];
}

function requireConfig() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase is not configured on the server.');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('Clerk server configuration is missing.');
  }
}

function itemPayload(item) {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  return {
    tmdb_id: Number(item.id),
    media_type: mediaType,
    title: item.title || null,
    name: item.name || null,
    poster_path: item.poster_path || null,
    vote_average: Number(item.vote_average || 0),
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
  };
}

export default async function handler(event) {
  if (!['GET', 'POST', 'DELETE'].includes(event.httpMethod)) {
    return json(405, { error: 'Method not allowed.' });
  }

  try {
    requireConfig();

    const authorization = event.headers.authorization || event.headers.Authorization || '';
    if (!authorization.startsWith('Bearer ')) return json(401, { error: 'Authentication required.' });

    const clerkUserId = await verifyClerkToken(authorization.slice(7));
    const resource = event.queryStringParameters?.resource || 'profile';

    await supabaseRequest('user_profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ clerk_user_id: clerkUserId }),
    });

    if (event.httpMethod === 'GET') {
      if (!['profile', 'watchlist', 'history'].includes(resource)) return json(400, { error: 'Invalid resource.' });

      if (resource === 'profile') {
        const rows = await supabaseRequest(`user_profiles?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=clerk_user_id,display_name,created_at,updated_at`);
        return json(200, rows[0] || { clerk_user_id: clerkUserId });
      }

      const table = resource === 'watchlist' ? 'watchlist_items' : 'watch_history';
      const order = resource === 'watchlist' ? 'created_at.desc' : 'watched_at.desc';
      const rows = await supabaseRequest(`${table}?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=*&order=${order}`);
      return json(200, rows);
    }

    let body = {};
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { return json(400, { error: 'Invalid JSON body.' }); }

    if (event.httpMethod === 'POST') {
      if (!['watchlist', 'history'].includes(resource) || !body.item) return json(400, { error: 'A valid resource and item are required.' });

      const payload = itemPayload(body.item);
      if (!payload.tmdb_id || !['movie', 'tv'].includes(payload.media_type)) return json(400, { error: 'Invalid media item.' });

      if (resource === 'watchlist') {
        const rows = await supabaseRequest('watchlist_items?on_conflict=clerk_user_id,tmdb_id,media_type', {
          method: 'POST',
          body: JSON.stringify({ clerk_user_id: clerkUserId, ...payload }),
        });
        return json(200, rows[0] || payload);
      }

      const rows = await supabaseRequest('watch_history?on_conflict=clerk_user_id,tmdb_id,media_type', {
        method: 'POST',
        body: JSON.stringify({ clerk_user_id: clerkUserId, ...payload, watched_at: new Date().toISOString() }),
      });
      return json(200, rows[0] || payload);
    }

    if (resource === 'watchlist' || resource === 'history') {
      const id = Number(body.item?.id ?? body.tmdb_id);
      const mediaType = body.item?.media_type || body.media_type;
      if (!id || !['movie', 'tv'].includes(mediaType)) return json(400, { error: 'Invalid media item.' });

      const table = resource === 'watchlist' ? 'watchlist_items' : 'watch_history';
      const rows = await supabaseRequest(`${table}?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&tmdb_id=eq.${id}&media_type=eq.${encodeURIComponent(mediaType)}`, {
        method: 'DELETE',
      });
      return json(200, rows);
    }

    return json(400, { error: 'Invalid request.' });
  } catch (error) {
    console.error('Account API error:', error);
    return json(500, { error: error.message || 'Account service failed.' });
  }
}

export { handler };
