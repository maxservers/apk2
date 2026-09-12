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
    if (!me || me.role !== "official") {
      return new Response(JSON.stringify({ error: "没有权限" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { targetId, role } = await request.json();
    const tid = await resolveTargetToUid(env, targetId);
    if (!tid || (role !== "admin" && role !== "owner" && role !== "user")) {
      return new Response(JSON.stringify({ error: "参数不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (tid === payload.uid) {
      return new Response(JSON.stringify({ error: "不能修改自己" }), {
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
      return new Response(JSON.stringify({ error: "对方是官方账号，不能改" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    target.role = role;
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
