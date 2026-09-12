import { verifySession, getCookie } from "../_lib/auth.js";

const KEY = "channel-data-v1";

export async function onRequestGet({ env }) {
  try {
    const raw = await env.FEED_KV.get(KEY);
    const items = raw ? JSON.parse(raw).items || [] : [];
    return new Response(JSON.stringify({ items }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { "content-type": "application/json" },
    });
  }
}

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const meRaw = await env.FEED_KV.get(`user:${payload.uid}`);
    const me = meRaw ? JSON.parse(meRaw) : null;
    if (!me || (me.role !== "official" && me.role !== "owner")) {
      return new Response(JSON.stringify({ error: "没有权限" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    await env.FEED_KV.put(KEY, JSON.stringify({ items }));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
