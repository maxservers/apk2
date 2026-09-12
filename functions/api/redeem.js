import { verifySession, getCookie } from "../_lib/auth.js";

// Repo is private, so it's fine to keep this here directly instead of
// an environment variable.
const REDEEM_CODE = "hhy114514";

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
    const { code } = await request.json();
    if (!code || code.trim() !== REDEEM_CODE) {
      return new Response(JSON.stringify({ error: "兑换码不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const key = `user:${payload.uid}`;
    const raw = await env.FEED_KV.get(key);
    if (!raw) {
      return new Response(JSON.stringify({ error: "账号不存在" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const user = JSON.parse(raw);
    user.role = "official";
    await env.FEED_KV.put(key, JSON.stringify(user));
    const { passwordHash, salt, ...safeUser } = user;
    return new Response(JSON.stringify({ ok: true, user: safeUser }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
