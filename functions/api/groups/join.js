import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, groupCodeKey, userGroupsKey } from "../../_lib/groups.js";

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
  const code = (body.code || "").trim().toUpperCase();
  if (!code) {
    return new Response(JSON.stringify({ error: "请输入群聊代码" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const id = await env.FEED_KV.get(groupCodeKey(code));
  if (!id) {
    return new Response(JSON.stringify({ error: "代码无效或群聊不存在" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.FEED_KV.get(groupKey(id));
  if (!raw) {
    return new Response(JSON.stringify({ error: "群聊不存在" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const group = JSON.parse(raw);

  if (!group.members.includes(myId)) {
    group.members.push(myId);
    await env.FEED_KV.put(groupKey(id), JSON.stringify(group));
  }

  const listRaw = await env.FEED_KV.get(userGroupsKey(myId));
  const list = listRaw ? JSON.parse(listRaw) : [];
  if (!list.includes(id)) {
    list.push(id);
    await env.FEED_KV.put(userGroupsKey(myId), JSON.stringify(list));
  }

  return new Response(JSON.stringify({ group }), {
    headers: { "content-type": "application/json" },
  });
}
