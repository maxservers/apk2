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
    const { fromId, accept } = await request.json();
    const myId = payload.uid;
    const from = (fromId || "").trim();
    if (!from) {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const reqKey = `freq:${myId}:${from}`;
    const existing = await env.FEED_KV.get(reqKey);
    if (!existing) {
      return new Response(JSON.stringify({ error: "这条好友申请不存在" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (accept) {
      const now = Date.now();
      await env.FEED_KV.put(`friend:${myId}:${from}`, JSON.stringify({ since: now }));
      await env.FEED_KV.put(`friend:${from}:${myId}`, JSON.stringify({ since: now }));
    }
    await env.FEED_KV.delete(reqKey);

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
