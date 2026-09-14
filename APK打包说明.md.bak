# 把 Signal 论坛打包成 Android APK（原生壳 App）

## 修复说明（重要）

原压缩包里 `App.jsx`（核心组件，约 21 万字节）被错放在了项目根目录，文件名也变成了 `App (2).jsx`，而 `src/main.jsx` 是从 `src/App.jsx` 导入的——如果不修正直接构建会报"找不到模块"的错误。这份打包已经把它移动并改名为 `src/App.jsx`，可以正常构建。

## 打包方式说明

项目里带了 `capacitor.config.json`：

```json
{
  "appId": "com.max.web",
  "appName": "Signal",
  "webDir": "dist",
  "server": {
    "url": "https://maxwrb.pages.dev/",
    "cleartext": false
  }
}
```

这意味着生成的 App **不是**把网页离线打包进 APK，而是一个原生外壳，启动后直接加载你部署在 Cloudflare Pages 上的网址（`server.url`）。好处：网站更新了 App 里立刻能看到最新内容，不用重新打包发版；缺点：打开 App 需要联网。如果你想改成"离线打包静态资源"模式，把 `server` 那段整个删掉即可，App 会改为加载本地 `dist/` 目录（`npm run build` 产物）。

打包用 [Capacitor](https://capacitorjs.com/) + GitHub Actions 完成，全程云端编译，不需要在自己电脑上装 Android Studio / SDK。

## 步骤

### 1. 推到 GitHub

```bash
git init
git add .
git commit -m "init: Signal 论坛 + Capacitor 打包配置"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 让 Actions 自动构建

推送后 Actions 会自动运行（也可在仓库 **Actions** 标签页手动点 **Run workflow**）。流程：

1. `npm install` 安装依赖（含 `@capacitor/core`、`@capacitor/android`）
2. `npm run build` 用 Vite 编译前端
3. `npx cap add android` 生成 Android 原生工程（首次运行）
4. `npx cap sync android` 同步配置进原生工程
5. `./gradlew assembleDebug` 编译出 `app-debug.apk`
6. 上传为构建产物（Artifact）

### 3. 下载 APK

进入对应的 Actions 运行页面，底部 **Artifacts** 里的 `app-debug-apk` 就是产物，下载解压后是 `app-debug.apk`，传到手机安装即可（需在手机设置里允许"安装未知来源应用"）。

想要能直接分享链接下载，可以打 tag 触发自动创建 Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 关于签名 / 上架 Google Play

现在生成的是 **Debug 版 APK**，未签名，只能直接安装，不能传 Google Play。要上架需要：

1. 生成正式签名密钥（keystore）
2. 把 keystore 内容和密码存进仓库 **Settings → Secrets and variables → Actions**
3. 工作流里把 `assembleDebug` 换成 `assembleRelease`，并配置签名信息

需要的话告诉我，我再补上签名流程。

## 想改 App 名称 / 图标 / 包名

- 名称、包名：改 `capacitor.config.json` 里的 `appName`、`appId`（改包名后如果 `android/` 已生成过，需删除后重新 `npx cap add android`）。
- 图标 / 启动图：推荐用 [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) 自动生成，需要的话可以帮你加进 Actions 流程。
