const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const ALLOWED_TASKS = new Set(['voice', 'scan']);
const ALLOWED_PROVIDERS = new Set(['auto', 'gemini', 'gpt', 'deepseek', 'kimi', 'grok']);

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...cors },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const ok = !origin || allowed.includes(origin);
  return {
    ok,
    headers: ok && origin ? {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type, apikey',
      'access-control-max-age': '86400',
      'vary': 'Origin',
    } : {},
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (!cors.ok) return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors.headers });

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'lingguang-cloudflare-gateway',
        mode: 'secure-proxy',
        upstreamConfigured: Boolean(env.SUPABASE_EDGE_URL),
      }, 200, cors.headers);
    }

    if (url.pathname !== '/api/ai' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, cors.headers);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400, cors.headers); }

    if (body?.product !== 'lingguang-health-os') {
      return json({ error: 'Invalid product' }, 400, cors.headers);
    }
    if (!ALLOWED_TASKS.has(body?.task)) {
      return json({ error: 'Invalid task' }, 400, cors.headers);
    }
    if (!ALLOWED_PROVIDERS.has(body?.provider || 'auto')) {
      return json({ error: 'Invalid provider' }, 400, cors.headers);
    }
    if (!env.SUPABASE_EDGE_URL) {
      return json({ error: 'Secure upstream is not configured yet' }, 503, cors.headers);
    }

    const headers = { 'content-type': 'application/json' };
    const auth = request.headers.get('Authorization');
    if (auth) headers.authorization = auth;
    if (env.SUPABASE_PUBLISHABLE_KEY) headers.apikey = env.SUPABASE_PUBLISHABLE_KEY;

    const upstream = await fetch(env.SUPABASE_EDGE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        ...cors.headers,
      },
    });
  },
};
