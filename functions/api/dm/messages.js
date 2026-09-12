import { verifySession, getCookie } from "../../_lib/auth.js";
import { chatKey } from "../../_lib/chat.js";
import { sendPushToUser } from "../../_lib/fcm.js";

async function isFriend(env, a, b) {
  const raw = await env.FEED_KV.get(`friend:${a}:${b}`);
  return !!raw;
}

async function followsMe(env, otherId, myId) {
  // does otherId follow myId back?
  const raw = await env.FEED_KV.get(`following:${otherId}:${myId}`);
  return !!raw;
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

  const url = new URL(request.url);
  const withId = (url.searchParams.get("with") || "").trim();
  if (!withId) {
    return new Response(JSON.stringify({ error: "参数不对" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const myId = payload.uid;
  const raw = await env.FEED_KV.get(`dm:${chatKey(myId, withId)}`);
  const messages = raw ? JSON.parse(raw) : [];
  return new Response(JSON.stringify({ messages }), {
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

  try {
    const { to, text } = await request.json();
    const myId = payload.uid;
    const withId = (to || "").trim();
    const body = (text || "").trim();
    if (!withId || withId === myId || !body) {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (body.length > 500) {
      return new Response(JSON.stringify({ error: "消息太长了" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Friends already have the full chat feature — keep DM for non-friends only.
    if (await isFriend(env, myId, withId)) {
      return new Response(JSON.stringify({ error: "你们已经是好友，请使用好友聊天" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const key = `dm:${chatKey(myId, withId)}`;
    const raw = await env.FEED_KV.get(key);
    const messages = raw ? JSON.parse(raw) : [];

    const theyFollowMe = await followsMe(env, withId, myId);
    if (!theyFollowMe) {
      const myPriorMessages = messages.filter((m) => m.from === myId);
      if (myPriorMessages.length >= 1) {
        return new Response(
          JSON.stringify({ error: "对方还没有回关，只能发送一条私信" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }

    const meRaw = await env.FEED_KV.get(`user:${myId}`);
    const me = meRaw ? JSON.parse(meRaw) : null;
    if (me && me.bannedChat) {
      return new Response(JSON.stringify({ error: "你已被封禁私聊" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const message = {
      id: crypto.randomUUID(),
      from: myId,
      text: body,
      createdAt: Date.now(),
    };
    messages.push(message);
    const trimmed = messages.length > 100 ? messages.slice(messages.length - 100) : messages;
    await env.FEED_KV.put(key, JSON.stringify(trimmed));

    const senderName = (me && (me.username || me.name)) || "有人";
    const p = sendPushToUser(env, withId, {
      title: `${senderName}（私信）`,
      body: body.length > 80 ? body.slice(0, 80) + "…" : body,
      data: { type: "dm", from: myId },
    });
    if (typeof waitUntil === "function") waitUntil(p);
    else await p;

    return new Response(JSON.stringify({ ok: true, message }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
