import { verifySession, getCookie } from "../../_lib/auth.js";
import { ensureFriendCode, reserveNewCode, releaseCode, canChangeCode } from "../../_lib/friendcode.js";

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
    const raw = await env.FEED_KV.get(`user:${payload.uid}`);
    if (!raw) {
      return new Response(JSON.stringify({ error: "找不到用户" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    let user = JSON.parse(raw);
    user = await ensureFriendCode(env, payload.uid, user);

    const check = canChangeCode(user);
    if (!check.allowed) {
      return new Response(
        JSON.stringify({ error: `还需等待 ${check.remainingDays} 天才能更换ID` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const oldCode = user.friendCode;
    const newCode = await reserveNewCode(env, payload.uid);
    await releaseCode(env, oldCode);

    const next = { ...user, friendCode: newCode, friendCodeChangedAt: Date.now() };
    await env.FEED_KV.put(`user:${payload.uid}`, JSON.stringify(next));

    return new Response(JSON.stringify({ ok: true, friendCode: newCode }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
