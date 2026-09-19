# 把 Signal 论坛打包成 Android APK（在线加载 + Google 推送通知版）

## 这一版是什么

- **网页套壳（在线加载模式）**：`capacitor.config.json` 里配置了 `server.url` 指向 `https://maxwrb.pages.dev/`，App 启动后直接加载这个线上地址。网站更新了 App 里立刻同步，不用重新打包发版；缺点是打开 App 需要联网。
- **不用改后端**：因为 App 加载的就是真实域名，跟网页版访问是同源请求，不存在跨域问题，也不需要碰 `functions/_middleware.js`、Cookie 的 `SameSite` 这些——都保持原样。
- **Google 推送通知**：接入 `@capacitor/push-notifications` + Firebase Cloud Messaging，配置好之后可以给登录用户推送消息通知。

## 修了一个 bug

原压缩包里 `App.jsx`（核心组件，21万字节）被错放在项目根目录、文件名也变成了 `App (2).jsx`，而 `src/main.jsx` 是从 `src/App.jsx` 导入的——不修的话直接构建会报"找不到模块"。已经移动并改名为 `src/App.jsx`。

## 关于推送通知：默认是关闭的，需要你去 Firebase 配置一下

原项目代码里已经写好了调用推送注册的逻辑（登录后会调用 `initPush()`），但从来没有配置过 Firebase。这个功能在 Android 上依赖 Firebase Cloud Messaging，如果没有配置 `google-services.json` 就调用，原生层会直接抛出未捕获异常，把整个 App 崩溃退出（登录后马上闪退）。

所以这版加了一个自动检测开关：**构建时如果发现仓库根目录有 `google-services.json`，就自动接入 Firebase 并打开推送；没有就自动跳过，不会崩溃，只是收不到推送**。

### 启用推送通知的步骤

推送要真正送达，需要两把不同的"钥匙"，缺一不可：

**第一把：`google-services.json`（让 Android App 能连上 Firebase）**

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，登录后点"添加项目"，随便起个名字，一路创建完成（可以跳过 Google Analytics）。
2. 进入项目后点 Android 图标，添加一个 Android 应用。**"Android 软件包名称"必须精确填 `com.max.web`**（跟 `capacitor.config.json` 里的 `appId` 一致）。
3. 注册完成后下载 `google-services.json`，其余"添加 SDK""添加代码"的步骤直接跳过。
4. 把文件放到项目**根目录**，文件名必须精确是 `google-services.json`（跟 `package.json` 同一层，不要放进 `android` 文件夹）。

**第二把：服务账号密钥（让 Cloudflare 后端能真正调用 Firebase 发送这条推送）**

1. 还是在 Firebase 控制台同一个项目里，左上角齿轮图标 → **项目设置** → 顶部选项卡切到 **服务账号（Service accounts）**。
2. 点 **生成新的私钥（Generate new private key）**，下载一个 JSON 文件——这个跟 `google-services.json` 是完全不同的两个文件，内容包含 `private_key` 字段。
3. 把下载的 JSON **内容整个复制**，覆盖粘贴进项目里的 `functions/_lib/fcm-service-account.json`（这个文件已经放了一个空的 `{}` 占位）。

然后一起提交推送：

```bash
git add google-services.json functions/_lib/fcm-service-account.json
git commit -m "接入 Firebase 推送"
git push
```

⚠️ **这把服务账号密钥是能以你的身份调用 Firebase 接口的凭证，权限和敏感程度比 `google-services.json` 高得多**。如果这个仓库是 **public 仓库**，提交这个文件意味着任何人都能拿到它——建议在 Firebase 生成密钥时，如果能选角色，选范围最小的"Firebase Cloud Messaging API 管理员"而不是默认的 Owner/Editor，这样万一泄露，影响也只限于被人拿去发推送，不会波及你 Firebase 项目里的其他资源。如果之后想换成更安全的方式（不进 git，改存 Cloudflare 的环境变量密钥），告诉我一声，代码已经同时支持两种方式，只要在 Cloudflare Pages 后台配置一个叫 `FCM_SERVICE_ACCOUNT_JSON` 的环境变量（值是 JSON 内容），它的优先级比仓库里这个文件更高，不用改代码就能直接切换。

推上去以后，Actions 那边会自动检测到根目录的 `google-services.json`，接入 Android 工程、配好 Gradle 插件；后端这边 `functions/_lib/fcm.js` 会自动读到 `fcm-service-account.json` 里的密钥，别人发消息/加好友/关注时就会真正推送过去了。

## 打包步骤（云端构建，不需要装 Android Studio）

### 1. 推到 GitHub

```bash
git init
git add .
git commit -m "init: Signal 论坛，在线套壳 + 推送通知"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. Actions 自动构建

推送后 `.github/workflows/build-apk.yml` 会自动跑：`npm install` → `npm run build` → 检测 Firebase 配置 → `npx cap add/sync android` → （有 Firebase 配置的话）接入 Firebase → `./gradlew assembleDebug` → 上传 APK。也可以在仓库 **Actions** 页手动点 **Run workflow**。

### 3. 下载安装

对应运行页面底部 **Artifacts** → `app-debug-apk`，下载解压得到 `app-debug.apk`，传到手机装（需要在设置里允许"安装未知来源应用"）。

想要直接生成可分享链接的 Release，打个 tag 再推：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 关于签名 / 上架 Google Play

现在生成的是 **Debug 版 APK**，未签名，只能直接安装测试，不能上传 Google Play。要上架的话需要生成正式签名密钥、存进仓库 Secrets，并把工作流里的 `assembleDebug` 换成 `assembleRelease`，需要的话可以再帮你补上。

## 想改 App 名称 / 图标 / 包名

- 名称、包名：改 `capacitor.config.json` 里的 `appName`、`appId`。
- 图标 / 启动图：推荐用 [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) 自动生成，需要的话可以帮你加进 Actions 流程。
