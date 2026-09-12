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
  const targetId = (url.searchParams.get("targetId") || "").trim();
  if (!targetId) {
    return new Response(JSON.stringify({ status: "none" }), {
      headers: { "content-type": "application/json" },
    });
  }

  const myId = payload.uid;
  const isFriend = await env.FEED_KV.get(`friend:${myId}:${targetId}`);
  if (isFriend) {
    return new Response(JSON.stringify({ status: "friends" }), {
      headers: { "content-type": "application/json" },
    });
  }
  const outgoing = await env.FEED_KV.get(`freq:${targetId}:${myId}`);
  if (outgoing) {
    return new Response(JSON.stringify({ status: "outgoing_pending" }), {
      headers: { "content-type": "application/json" },
    });
  }
  const incoming = await env.FEED_KV.get(`freq:${myId}:${targetId}`);
  if (incoming) {
    return new Response(JSON.stringify({ status: "incoming_pending" }), {
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ status: "none" }), {
    headers: { "content-type": "application/json" },
  });
}
