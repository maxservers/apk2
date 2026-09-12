import {
  signSession,
  makeSessionCookie,
  SESSION_MAX_AGE,
  hashPassword,
} from "../../_lib/auth.js";
import { resolveTargetToUid, ensureFriendCode } from "../../_lib/friendcode.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const rawInput = (username || "").trim();
    if (!rawInput || !password) {
      return new Response(JSON.stringify({ error: "请输入用户名/ID和密码" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const uname = await resolveTargetToUid(env, rawInput);
    if (!uname) {
      return new Response(JSON.stringify({ error: "用户名或密码不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const key = `user:${uname}`;
    const raw = await env.FEED_KV.get(key);
    if (!raw) {
      return new Response(JSON.stringify({ error: "用户名或密码不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const user = JSON.parse(raw);
    if (!user.passwordHash || !user.salt) {
      return new Response(
        JSON.stringify({ error: "这个账号不是用密码注册的" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return new Response(JSON.stringify({ error: "用户名或密码不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const withCode = await ensureFriendCode(env, uname, user);

    const token = await signSession(
      { uid: uname, exp: Date.now() + SESSION_MAX_AGE * 1000 },
      env.SESSION_SECRET
    );

    const { passwordHash: _ph, salt: _s, ...safeUser } = withCode;
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
