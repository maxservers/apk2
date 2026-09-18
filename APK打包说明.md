# 把 Signal 论坛打包成 Android APK（离线打包静态资源版）

## 先说清楚："离线"能做到什么程度

**这是一个前后端分离、数据存在 Cloudflare（KV）的论坛**：发帖、聊天、好友、登录这些功能全靠 `functions/api/*` 这些跑在 Cloudflare 上的接口。这部分**不可能塞进 APK 里离线运行**——没有网络的时候，帖子、聊天、登录这些功能本来就用不了，这跟用什么方式打包无关。

真正能做到"离线打包"的，是**前端界面本身**（HTML/CSS/JS）：

- **改之前**（`server.url` 指向线上地址）：App 每次打开都要从 `https://maxwrb.pages.dev` 下载页面外壳，再执行里面的 JS。
- **改之后**（这次的版本）：页面外壳（`npm run build` 出来的 `dist/`）被直接打包进 APK，App 启动**不需要联网就能看到界面**；但一旦要发帖、登录、看消息，还是要连网调用 Cloudflare 上的接口——这部分永远需要网络。

如果这正是你想要的效果（离线也能秒开界面，只有实际数据交互需要联网），下面的改动就是为此做的。

## 这次具体改了什么

打包方式变了之后，App 的运行环境从"加载 `https://maxwrb.pages.dev`"变成"加载本地文件，origin 是 `https://localhost`"——这会带来一连串连锁问题，已经一并处理：

| 问题 | 原因 | 处理方式 |
|---|---|---|
| `capacitor.config.json` | 之前配了 `server.url` 指向线上地址 | 删掉 `server` 字段，改为加载本地 `dist/` |
| 所有 `fetch("/api/...")` 请求打不通 | App 现在的 origin 是 `https://localhost`，相对路径 `/api/xxx` 会指向 App 自己，而不是 Cloudflare 后端 | 在 `src/main.jsx` 里加了一段 fetch 补丁：检测到在打包 App 里运行时，自动把 `/api/...` 改写成 `https://maxwrb.pages.dev/api/...` |
| 跨域请求被浏览器拦截（CORS） | 后端原本没做任何 CORS 处理，只允许同源请求 | 在 `functions/_middleware.js` 里给来自 App 固定 origin（`https://localhost`）的 `/api/*` 请求加上 `Access-Control-Allow-*` 响应头，并处理浏览器的 OPTIONS 预检请求 |
| 登录后 Cookie 没法带上 | 登录 Session Cookie 原本是 `SameSite=Lax`，浏览器规定这种 Cookie 不会随"跨站"请求发送，而现在 App→后端已经是跨站了 | 把 `functions/_lib/auth.js` 里的 `SameSite=Lax` 改成 `SameSite=None`（配合已有的 `Secure`）。这个改动**只影响跨站请求，网页版直接访问 maxwrb.pages.dev 走同源请求，行为完全不变** |
| App.jsx 找不到模块 | 原压缩包里 `App.jsx`（核心组件）被错放到项目根目录且改了名字 | 已挪回并改名为 `src/App.jsx` |

⚠️ **有一处功能没有完全适配：Google 登录**。跳转到 Google 授权、授权完成后跳回来，这一整套是浏览器重定向流程，目前的处理是"离线包里点 Google 登录会跳去线上网页版完成登录"，能用，但会短暂离开原生外壳界面。如果需要做成不跳出 App 的深链接授权，需要额外接入 `@capacitor/browser` 或自定义 URL scheme，工作量不小，需要的话可以再单独做。

## 已修复：登录后闪退

登录成功、以及每次打开 App 时检测到已登录状态，代码里都会调用 `initPush()` 尝试注册推送通知。这个功能（`@capacitor/push-notifications`）在 Android 上依赖 **Firebase Cloud Messaging**，需要项目里有 `android/app/google-services.json` 并在 Gradle 里接入 `google-services` 插件，Firebase 才能正常初始化。这个仓库一直没有配置这些，所以一调用 `PushNotifications.register()`，原生层就会因为 Firebase 未初始化抛出异常，且这个异常不会被 JS 的 `try/catch` 接住，直接把整个 App 干崩溃——这就是"一登录就闪退"的原因。

**当前处理**：`src/push.js` 里的 `initPush()` 现在由一个开关 `PUSH_ENABLED` 控制，这个开关在构建时由 GitHub Actions 自动注入——**只有当仓库根目录能找到 `google-services.json` 时才会打开**，否则保持关闭。也就是说现在不用你手动改代码，登录、发帖、聊天等核心功能不受影响，暂时只是收不到推送提醒。

**想要真正启用推送通知**，需要：

1. 去 [Firebase 控制台](https://console.firebase.google.com/) 新建一个项目，添加一个 Android 应用，包名填 `com.max.web`（跟 `capacitor.config.json` 里的 `appId` 一致）
2. 下载生成的 `google-services.json`，放到项目**根目录**（跟 `package.json` 同一层，不要放进 `android` 文件夹，那个目录每次构建都会重新生成）
3. `git add google-services.json && git commit && git push`

推送后 Actions 会自动检测到这个文件，把它接入 Android 工程、配置好 `google-services` Gradle 插件，并且在这次构建里把推送功能打开——不需要再额外改代码或找我。

## 打包步骤（和之前一样，云端构建）

### 1. 把代码推到 GitHub

```bash
git init
git add .
git commit -m "init: Signal 论坛，离线打包静态资源版"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

> 注意：这次改动里 `functions/_middleware.js` 和 `functions/_lib/auth.js` 是**后端代码**。如果你的 Cloudflare Pages 项目是通过这个 GitHub 仓库自动部署的，推送后它会自动重新部署，CORS 和 Cookie 的修改才会在线上生效——APK 里的 App 才能正常登录/发帖。如果你的 CF Pages 项目不是接的这个仓库，需要手动把这两个文件的改动同步过去并重新部署一次。

### 2. Actions 自动构建 APK

推送后 GitHub Actions（`.github/workflows/build-apk.yml`）会自动：

1. `npm install`
2. `npm run build`（把最新前端打进 `dist/`）
3. `npx cap add android`（首次）+ `npx cap sync android`（把 `dist/` 同步进原生工程）
4. `./gradlew assembleDebug` 编译出 `app-debug.apk`
5. 作为 Artifact 上传

也可以在仓库的 **Actions** 页手动点 **Run workflow** 触发。

### 3. 下载安装

对应运行页面底部 **Artifacts** → `app-debug-apk`，下载解压得到 `app-debug.apk`，传到手机装（需要在设置里允许"安装未知来源应用"）。

想要直接生成可分享链接的 Release，打个 tag 再推：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 以后每次改了网页内容，App 要不要重新打包？

**需要**。因为界面现在是打进 APK 里的静态文件，不是实时从网上加载的。改了前端代码后，重新走一遍上面的推送流程，Actions 会重新编译出新的 APK。如果你更看重"改完网页立刻生效、不用重新发 APK"，可以告诉我改回"在线加载模式"（也就是恢复 `capacitor.config.json` 里的 `server.url`）。

## 关于签名 / 上架 Google Play

现在是 **未签名 Debug APK**，可以直接装机测试，不能传 Google Play。要上架需要生成正式签名密钥、存进仓库 Secrets，并把工作流里的 `assembleDebug` 换成 `assembleRelease`，需要的话我可以帮你补上这部分。

## 想改 App 名称 / 图标 / 包名

- 名称、包名：改 `capacitor.config.json` 里的 `appName`、`appId`（改包名后如果 `android/` 已生成过，需删除后重新 `npx cap add android`）。
- 图标 / 启动图：推荐用 [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) 自动生成，需要的话可以帮你加进 Actions 流程。
