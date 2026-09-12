// 全站密码门：在 Cloudflare Pages 后台 Settings -> Environment variables
// 添加一个变量 SITE_PASSWORD，值就是你想设置的访问密码。
// 没有配置这个变量时，中间件会直接放行（不会把自己也锁在外面）。

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  const SITE_PASSWORD = env.SITE_PASSWORD || "";
  if (!SITE_PASSWORD) {
    return next();
  }

  const expectedToken = await sha256(SITE_PASSWORD);
  const cookies = parseCookies(request.headers.get("Cookie") || "");

  // 提交密码的接口
  if (request.method === "POST" && url.pathname === "/__gate") {
    let pw = "";
    try {
      const form = await request.formData();
      pw = (form.get("pw") || "").toString();
    } catch (e) {
      pw = "";
    }

    if (pw === SITE_PASSWORD) {
      const headers = new Headers();
      headers.set("Location", "/");
      headers.append(
        "Set-Cookie",
        `site_auth=${expectedToken}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
      );
      return new Response(null, { status: 302, headers });
    }

    return new Response(gatePage(true), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // 已经登录过，放行
  if (cookies.site_auth === expectedToken) {
    return next();
  }

  // 没登录，展示密码页
  return new Response(gatePage(false), {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function parseCookies(header) {
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function gatePage(showError) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>需要密码</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f6e5c;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .card {
    background: #fff;
    border-radius: 20px;
    padding: 32px 28px;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  }
  h1 { font-size: 18px; margin: 0 0 18px; color: #1c1c1e; }
  input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #ddd;
    font-size: 15px;
    margin-bottom: 12px;
  }
  button {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: none;
    background: #0f6e5c;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }
  .err { color: #d1394f; font-size: 13px; margin: -6px 0 12px; }
</style>
</head>
<body>
  <div class="card">
    <h1>请输入访问密码</h1>
    ${showError ? '<div class="err">密码不对，再试一次</div>' : ""}
    <form method="post" action="/__gate">
      <input type="password" name="pw" placeholder="密码" autofocus required />
      <button type="submit">进入</button>
    </form>
  </div>
</body>
</html>`;
}
