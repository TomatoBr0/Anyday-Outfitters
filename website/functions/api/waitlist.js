// Cloudflare Pages Function: POST /api/waitlist
// Stores emails in a KV namespace bound as WAITLIST (Pages → Settings → Functions → KV bindings).
// Without the binding it returns 503 so nothing is silently dropped.
export async function onRequestPost({ request, env }) {
  let email = '';
  try {
    ({ email } = await request.json());
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return json({ error: 'Invalid email' }, 400);
  }
  if (!env.WAITLIST) return json({ error: 'Waitlist not configured' }, 503);
  const existing = await env.WAITLIST.get(email);
  if (!existing) {
    await env.WAITLIST.put(email, JSON.stringify({ at: new Date().toISOString(), country: request.cf?.country ?? null }));
  }
  return json({ ok: true });
}

export function onRequest() {
  return json({ error: 'Method not allowed' }, 405);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
