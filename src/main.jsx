import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ---- 离线打包 App 专用：把 /api/* 请求转发到线上 Cloudflare 后端 ----
// 网页版直接访问 maxwrb.pages.dev 时，/api/xxx 是同源相对路径，不受影响。
// 离线打包的 Android App 加载的是本地打包好的静态资源，origin 变成了
// https://localhost，这时相对路径 /api/xxx 会指向 App 自己（根本没有后端），
// 所以要把这类请求改写成完整的线上地址，并带上 credentials 让登录 Cookie
// 能正常跨域携带（配合后端 functions/_middleware.js 里加的 CORS 支持）。
const API_BASE = "https://maxwrb.pages.dev";
const NATIVE_APP_ORIGINS = ["https://localhost", "capacitor://localhost"];

if (NATIVE_APP_ORIGINS.includes(window.location.origin)) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const isPlainPath =
      typeof input === "string" && input.startsWith("/") && !input.startsWith("//");
    const isRelativeRequest =
      input instanceof Request && input.url.startsWith(window.location.origin + "/");

    if (isPlainPath) {
      return originalFetch(API_BASE + input, {
        ...init,
        credentials: init.credentials || "include",
      });
    }
    if (isRelativeRequest) {
      const path = input.url.slice(window.location.origin.length);
      return originalFetch(new Request(API_BASE + path, input), {
        credentials: init.credentials || "include",
      });
    }
    return originalFetch(input, init);
  };
}
// -------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
