import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, groupMsgsKey } from "../../_lib/groups.js";

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const myId = payload.uid;

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const groupId = (body.groupId || "").trim();
  if (!groupId) {
    return new Response(JSON.stringify({ error: "参数不对" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.FEED_KV.get(groupKey(groupId));
  if (!raw) {
    return new Response(JSON.stringify({ error: "群聊不存在" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const group = JSON.parse(raw);
  if (!group.members.includes(myId)) {
    return new Response(JSON.stringify({ error: "你不在这个群里" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  await env.FEED_KV.put(groupMsgsKey(groupId), JSON.stringify([]));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
