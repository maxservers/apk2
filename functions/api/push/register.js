import { verifySession, getCookie } from "../../_lib/auth.js";

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
    const { token: deviceToken, remove } = await request.json();
    if (!deviceToken || typeof deviceToken !== "string") {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const key = `push:${payload.uid}`;
    const raw = await env.FEED_KV.get(key);
    let tokens = raw ? JSON.parse(raw) : [];

    if (remove) {
      tokens = tokens.filter((t) => t !== deviceToken);
    } else if (!tokens.includes(deviceToken)) {
      tokens.push(deviceToken);
      if (tokens.length > 10) tokens = tokens.slice(tokens.length - 10);
    }

    await env.FEED_KV.put(key, JSON.stringify(tokens));

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
