import { genCode } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "邮箱格式不对" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const key = email.toLowerCase().trim();
    const code = genCode();
    await env.FEED_KV.put(`code:${key}`, code, { expirationTtl: 600 });

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: env.SENDER_EMAIL, name: "Signal" },
        to: [{ email: key }],
        subject: "你的登录验证码",
        htmlContent: `<p>你的验证码是 <b style="font-size:20px">${code}</b>，10 分钟内有效。</p>`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: "发送失败", detail }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

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
