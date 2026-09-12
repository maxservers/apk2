import { verifySession, getCookie } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const myId = payload.uid;
  const prefix = `freq:${myId}:`;
  const page = await env.FEED_KV.list({ prefix, limit: 100 });

  const results = [];
  for (const key of page.keys) {
    const fromId = key.name.slice(prefix.length);
    const raw = await env.FEED_KV.get(`user:${fromId}`);
    if (!raw) continue;
    const u = JSON.parse(raw);
    results.push({
      id: u.id || fromId,
      name: u.name || fromId,
      avatarUrl: u.avatarUrl || null,
      color: u.color || null,
    });
  }

  return new Response(JSON.stringify({ requests: results }), {
    headers: { "content-type": "application/json" },
  });
}
