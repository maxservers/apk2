import { verifySession, getCookie } from "../../_lib/auth.js";
import { sendPushToUser } from "../../_lib/fcm.js";

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
    const target = (targetId || "").trim();
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

    const followingKey = `following:${myId}:${target}`;
    const followerKey = `follower:${target}:${myId}`;
    const already = await env.FEED_KV.get(followingKey);

    let following;
    if (already) {
      await env.FEED_KV.delete(followingKey);
      await env.FEED_KV.delete(followerKey);
      following = false;
    } else {
      const now = Date.now();
      await env.FEED_KV.put(followingKey, String(now));
      await env.FEED_KV.put(followerKey, String(now));
      following = true;

      const meRaw = await env.FEED_KV.get(`user:${myId}`);
      const me = meRaw ? JSON.parse(meRaw) : null;
      const p = sendPushToUser(env, target, {
        title: "新的关注",
        body: `${(me && (me.username || me.name)) || "有人"} 关注了你`,
        data: { type: "follow", from: myId },
      });
      if (typeof waitUntil === "function") waitUntil(p);
      else await p;
    }

    const followersPage = await env.FEED_KV.list({ prefix: `follower:${target}:`, limit: 1000 });
    const followersCount = followersPage.keys.length;

    return new Response(JSON.stringify({ ok: true, following, followersCount }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
