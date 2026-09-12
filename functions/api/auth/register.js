import {
  signSession,
  makeSessionCookie,
  SESSION_MAX_AGE,
  randomColor,
  randomSalt,
  hashPassword,
} from "../../_lib/auth.js";
import { ensureFriendCode } from "../../_lib/friendcode.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password, confirmPassword } = await request.json();
    const uname = (username || "").trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
      return new Response(
        JSON.stringify({ error: "用户名需为 3-20 位字母/数字/下划线" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "密码至少 6 位" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "两次输入的密码不一致" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const key = `user:${uname}`;
    const existing = await env.FEED_KV.get(key);
    if (existing) {
      return new Response(JSON.stringify({ error: "用户名已被注册" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    const cf = request.cf || {};
    const ipLocation = [cf.city, cf.regionCode || cf.region, cf.country]
      .filter(Boolean)
      .join(" ") || "";
    const user = {
      id: uname,
      username: uname,
      name: "",
      provider: "password",
      passwordHash,
      salt,
      avatarUrl: null,
      bannerUrl: null,
      bio: "",
      hobby: "",
      ipLocation,
      color: randomColor(),
      createdAt: Date.now(),
    };
    await env.FEED_KV.put(key, JSON.stringify(user));
    const userWithCode = await ensureFriendCode(env, uname, user);

    const token = await signSession(
      { uid: uname, exp: Date.now() + SESSION_MAX_AGE * 1000 },
      env.SESSION_SECRET
    );

    const { passwordHash: _ph, salt: _s, ...safeUser } = userWithCode;
    return new Response(JSON.stringify({ ok: true, user: safeUser }), {
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
