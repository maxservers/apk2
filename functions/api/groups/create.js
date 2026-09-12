import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, groupCodeKey, userGroupsKey, genGroupCode, genGroupId } from "../../_lib/groups.js";

async function isFriend(env, myId, otherId) {
  const raw = await env.FEED_KV.get(`friend:${myId}:${otherId}`);
  return !!raw;
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
  const myId = payload.uid;

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const name = (body.name || "").trim().slice(0, 40) || "新群聊";
  const memberIds = Array.from(
    new Set((body.memberIds || []).map((s) => String(s).trim()).filter(Boolean))
  );

  if (memberIds.length === 0) {
    return new Response(JSON.stringify({ error: "创建群聊至少要邀请一位好友" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  for (const id of memberIds) {
    if (!(await isFriend(env, myId, id))) {
      return new Response(JSON.stringify({ error: "只能邀请好友入群" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const id = genGroupId();
  let code = genGroupCode();
  for (let i = 0; i < 6; i++) {
    const existing = await env.FEED_KV.get(groupCodeKey(code));
    if (!existing) break;
    code = genGroupCode();
  }

  const members = Array.from(new Set([myId, ...memberIds]));
  const group = {
    id,
    name,
    ownerId: myId,
    members,
    code,
    createdAt: Date.now(),
  };

  await env.FEED_KV.put(groupKey(id), JSON.stringify(group));
  await env.FEED_KV.put(groupCodeKey(code), id);

  for (const uid of members) {
    const raw = await env.FEED_KV.get(userGroupsKey(uid));
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(id)) list.push(id);
    await env.FEED_KV.put(userGroupsKey(uid), JSON.stringify(list));
  }

  return new Response(JSON.stringify({ group }), {
    headers: { "content-type": "application/json" },
  });
}
