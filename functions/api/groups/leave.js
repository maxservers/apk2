import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, groupCodeKey, userGroupsKey, groupMsgsKey } from "../../_lib/groups.js";

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
  if (raw) {
    const group = JSON.parse(raw);
    group.members = group.members.filter((id) => id !== myId);
    if (group.members.length === 0) {
      await env.FEED_KV.delete(groupKey(groupId));
      await env.FEED_KV.delete(groupCodeKey(group.code));
      await env.FEED_KV.delete(groupMsgsKey(groupId));
    } else {
      if (group.ownerId === myId) group.ownerId = group.members[0];
      await env.FEED_KV.put(groupKey(groupId), JSON.stringify(group));
    }
  }

  const listRaw = await env.FEED_KV.get(userGroupsKey(myId));
  const list = listRaw ? JSON.parse(listRaw) : [];
  await env.FEED_KV.put(
    userGroupsKey(myId),
    JSON.stringify(list.filter((id) => id !== groupId))
  );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
