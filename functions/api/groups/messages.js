import { verifySession, getCookie } from "../../_lib/auth.js";
import { groupKey, groupMsgsKey } from "../../_lib/groups.js";
import { sendPushToUser } from "../../_lib/fcm.js";

async function loadGroup(env, groupId) {
  const raw = await env.FEED_KV.get(groupKey(groupId));
  return raw ? JSON.parse(raw) : null;
}

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

  const url = new URL(request.url);
  const groupId = (url.searchParams.get("groupId") || "").trim();
  if (!groupId) {
    return new Response(JSON.stringify({ error: "参数不对" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const group = await loadGroup(env, groupId);
  if (!group || !group.members.includes(myId)) {
    return new Response(JSON.stringify({ error: "不在群里" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.FEED_KV.get(groupMsgsKey(groupId));
  const messages = raw ? JSON.parse(raw) : [];

  return new Response(JSON.stringify({ messages, group }), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
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
  const text = (body.text || "").trim();
  const imageUrl = body.imageUrl || null;

  if (!groupId || (!text && !imageUrl)) {
    return new Response(JSON.stringify({ error: "参数不对" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (text.length > 2000) {
    return new Response(JSON.stringify({ error: "消息太长了" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (imageUrl && imageUrl.length > 2_000_000) {
    return new Response(JSON.stringify({ error: "图片太大了" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const group = await loadGroup(env, groupId);
  if (!group || !group.members.includes(myId)) {
    return new Response(JSON.stringify({ error: "不在群里" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const meRaw = await env.FEED_KV.get(`user:${myId}`);
  const me = meRaw ? JSON.parse(meRaw) : null;
  if (me && me.bannedChat) {
    return new Response(JSON.stringify({ error: "你已被封禁私聊" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.FEED_KV.get(groupMsgsKey(groupId));
  const messages = raw ? JSON.parse(raw) : [];
  const message = {
    id: crypto.randomUUID(),
    from: myId,
    text,
    imageUrl: imageUrl || null,
    createdAt: Date.now(),
  };
  messages.push(message);
  const trimmed = messages.length > 300 ? messages.slice(messages.length - 300) : messages;
  await env.FEED_KV.put(groupMsgsKey(groupId), JSON.stringify(trimmed));

  const senderName = (me && (me.username || me.name)) || "有人";
  const preview = text || (imageUrl ? "[图片]" : "");
  const others = group.members.filter((id) => id !== myId);
  const pushPromise = Promise.all(
    others.map((id) =>
      sendPushToUser(env, id, {
        title: `${senderName} · ${group.name}`,
        body: preview.length > 80 ? preview.slice(0, 80) + "…" : preview,
        data: { type: "group", groupId },
      })
    )
  );
  if (typeof waitUntil === "function") waitUntil(pushPromise);
  else await pushPromise;

  return new Response(JSON.stringify({ ok: true, message }), {
    headers: { "content-type": "application/json" },
  });
}
