import {
  signSession,
  makeSessionCookie,
  SESSION_MAX_AGE,
  randomColor,
} from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "缺少参数" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const key = email.toLowerCase().trim();
    const stored = await env.FEED_KV.get(`code:${key}`);
    if (!stored || stored !== String(code).trim()) {
      return new Response(JSON.stringify({ error: "验证码不对或已过期" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    await env.FEED_KV.delete(`code:${key}`);

    const userKey = `user:${key}`;
    const userRaw = await env.FEED_KV.get(userKey);
    let user;
    if (userRaw) {
      user = JSON.parse(userRaw);
    } else {
      user = {
        email: key,
        name: key.split("@")[0],
        provider: "email",
        avatarUrl: null,
        color: randomColor(),
        createdAt: Date.now(),
      };
      await env.FEED_KV.put(userKey, JSON.stringify(user));
    }

    const token = await signSession(
      { email: user.email, name: user.name, exp: Date.now() + SESSION_MAX_AGE * 1000 },
      env.SESSION_SECRET
    );

    return new Response(JSON.stringify({ ok: true, user }), {
      headers: {
        "content-type": "application/json",
        "Set-Cookie": makeSessionCookie(token, SESSION_MAX_AGE),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "服务器错误", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
