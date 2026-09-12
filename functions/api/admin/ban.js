import { verifySession, getCookie } from "../../_lib/auth.js";
import { resolveTargetToUid } from "../../_lib/friendcode.js";

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const meRaw = await env.FEED_KV.get(`user:${payload.uid}`);
    const me = meRaw ? JSON.parse(meRaw) : null;
    if (!me || (me.role !== "admin" && me.role !== "official")) {
      return new Response(JSON.stringify({ error: "没有权限" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { targetId, type, banned } = await request.json();
    const tid = await resolveTargetToUid(env, targetId);
    if (!tid || (type !== "chat" && type !== "feed") || typeof banned !== "boolean") {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (tid === payload.uid) {
      return new Response(JSON.stringify({ error: "不能封禁自己" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const key = `user:${tid}`;
    const raw = await env.FEED_KV.get(key);
    if (!raw) {
      return new Response(JSON.stringify({ error: "找不到这个用户" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const target = JSON.parse(raw);
    if (target.role === "official") {
      return new Response(JSON.stringify({ error: "不能封禁官方账号" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (target.role === "admin" && me.role !== "official") {
      return new Response(JSON.stringify({ error: "管理员不能封禁其他管理员" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (type === "chat") target.bannedChat = banned;
    if (type === "feed") target.bannedFeed = banned;
    await env.FEED_KV.put(key, JSON.stringify(target));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
