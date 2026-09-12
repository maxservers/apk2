import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, userGroupsKey } from "../../_lib/groups.js";

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

  const raw = await env.FEED_KV.get(userGroupsKey(myId));
  const ids = raw ? JSON.parse(raw) : [];
  const groups = [];
  for (const id of ids) {
    const g = await env.FEED_KV.get(groupKey(id));
    if (g) groups.push(JSON.parse(g));
  }
  groups.sort((a, b) => b.createdAt - a.createdAt);

  return new Response(JSON.stringify({ groups }), {
    headers: { "content-type": "application/json" },
  });
}
