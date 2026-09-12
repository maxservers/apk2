import { verifySession, getCookie } from "../../_lib/auth.js";
import { sendPushToUser } from "../../_lib/fcm.js";
import { resolveTargetToUid } from "../../_lib/friendcode.js";

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
    const { targetId } = await request.json();
    const myId = payload.uid;
    const target = await resolveTargetToUid(env, targetId);
    if (!target || target === myId) {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const targetUser = await env.FEED_KV.get(`user:${target}`);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: "找不到这个用户" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Already friends
    const alreadyFriends = await env.FEED_KV.get(`friend:${myId}:${target}`);
    if (alreadyFriends) {
      return new Response(JSON.stringify({ ok: true, status: "friends" }), {
        headers: { "content-type": "application/json" },
      });
    }

    // They already sent me a request — accept it instead of creating a duplicate
    const theirRequest = await env.FEED_KV.get(`freq:${myId}:${target}`);
    if (theirRequest) {
      const now = Date.now();
      await env.FEED_KV.put(`friend:${myId}:${target}`, JSON.stringify({ since: now }));
      await env.FEED_KV.put(`friend:${target}:${myId}`, JSON.stringify({ since: now }));
      await env.FEED_KV.delete(`freq:${myId}:${target}`);

      const meRaw = await env.FEED_KV.get(`user:${myId}`);
      const me = meRaw ? JSON.parse(meRaw) : null;
      const p = sendPushToUser(env, target, {
        title: "新的好友",
        body: `${(me && (me.username || me.name)) || "有人"} 接受了你的好友请求`,
        data: { type: "friend_accepted", from: myId },
      });
      if (typeof waitUntil === "function") waitUntil(p);
      else await p;

      return new Response(JSON.stringify({ ok: true, status: "friends" }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Otherwise create (or leave) a pending request from me to them
    await env.FEED_KV.put(
      `freq:${target}:${myId}`,
      JSON.stringify({ from: myId, to: target, createdAt: Date.now() })
    );

    const meRaw2 = await env.FEED_KV.get(`user:${myId}`);
    const me2 = meRaw2 ? JSON.parse(meRaw2) : null;
    const p2 = sendPushToUser(env, target, {
      title: "新的好友请求",
      body: `${(me2 && (me2.username || me2.name)) || "有人"} 想加你为好友`,
      data: { type: "friend_request", from: myId },
    });
    if (typeof waitUntil === "function") waitUntil(p2);
    else await p2;

    return new Response(JSON.stringify({ ok: true, status: "outgoing_pending" }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
