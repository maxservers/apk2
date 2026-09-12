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

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { "content-type": "application/json" },
    });
  }

  const results = [];
  let cursor;
  do {
    const page = await env.FEED_KV.list({ prefix: "user:", cursor, limit: 1000 });
    for (const key of page.keys) {
      const id = key.name.slice("user:".length);
      if (id === payload.uid) continue;
      const raw = await env.FEED_KV.get(key.name);
      if (!raw) continue;
      const u = JSON.parse(raw);
      const name = (u.name || "").toLowerCase();
      const code = (u.friendCode || "").toLowerCase();
      if (id.includes(q) || name.includes(q) || code === q || code.includes(q)) {
        results.push({
          id: u.id || id,
          name: u.name || id,
          avatarUrl: u.avatarUrl || null,
          color: u.color || null,
          friendCode: u.friendCode || null,
        });
      }
      if (results.length >= 20) break;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && results.length < 20);

  return new Response(JSON.stringify({ results: results.slice(0, 20) }), {
    headers: { "content-type": "application/json" },
  });
}
