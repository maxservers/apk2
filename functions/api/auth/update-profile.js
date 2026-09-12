import { verifySession, getCookie } from "../../_lib/auth.js";

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
    const body = await request.json();
    const key = `user:${payload.uid}`;
    const raw = await env.FEED_KV.get(key);
    if (!raw) {
      return new Response(JSON.stringify({ error: "账号不存在" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const current = JSON.parse(raw);

    if (typeof body.name === "string" && body.name.trim()) {
      current.name = body.name.trim().slice(0, 30);
    }
    if (typeof body.avatarUrl === "string" || body.avatarUrl === null) {
      // cap avatar size defensively (~400KB base64) to keep the KV blob reasonable
      current.avatarUrl =
        typeof body.avatarUrl === "string" && body.avatarUrl.length > 400000
          ? current.avatarUrl || null
          : body.avatarUrl || null;
    }
    if (typeof body.bannerUrl === "string" || body.bannerUrl === null) {
      current.bannerUrl =
        typeof body.bannerUrl === "string" && body.bannerUrl.length > 600000
          ? current.bannerUrl || null
          : body.bannerUrl || null;
    }
    if (typeof body.bio === "string") {
      current.bio = body.bio.trim().slice(0, 120);
    }
    if (typeof body.hobby === "string") {
      current.hobby = body.hobby.trim().slice(0, 60);
    }
    if (typeof body.color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.color)) {
      current.color = body.color;
    }
    if (body.theme === "dark" || body.theme === "light") {
      current.theme = body.theme;
    }

    await env.FEED_KV.put(key, JSON.stringify(current));

    const { passwordHash, salt, ...safeUser } = current;
    return new Response(JSON.stringify({ ok: true, user: safeUser }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "保存失败", detail: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
