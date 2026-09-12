// Cloudflare Pages Function.
// Requires a KV namespace bound as FEED_KV (see wrangler.toml / dashboard setup).
// GET  /api/data  -> returns { posts: [...] }
// POST /api/data  -> body { posts: [...] }, overwrites the stored data

const KEY = "microfeed-data-v1";

export async function onRequestGet({ env }) {
  const raw = await env.FEED_KV.get(KEY);
  const body = raw || JSON.stringify({ posts: [] });
  return new Response(body, {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const body = await request.text();
  try {
    JSON.parse(body); // validate it's real JSON before storing
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  await env.FEED_KV.put(KEY, body);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
