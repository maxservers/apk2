// Push notification wiring for the Capacitor Android wrapper.
// No-ops harmlessly when running as a plain website (no Capacitor native runtime).

let initialized = false;

async function registerTokenWithServer(token, remove = false) {
  try {
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, remove }),
    });
  } catch (e) {
    // Non-fatal — user just won't get push until this succeeds on a later attempt.
    console.warn("push token register failed", e);
  }
}

// 构建时由 GitHub Actions 注入：仓库根目录能找到 google-services.json 才会是
// "true"，否则保持关闭，避免在 Firebase 没配置好的情况下调用原生推送接口导致崩溃。
const PUSH_ENABLED = import.meta.env.VITE_PUSH_ENABLED === "true";

export async function initPush() {
  if (initialized) return;
  if (!PUSH_ENABLED) return; // Firebase 还没配置，先跳过
  if (typeof window === "undefined" || !window.Capacitor || !window.Capacitor.isNativePlatform()) {
    return; // Running in a normal browser tab — nothing to do.
  }
  initialized = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== "granted") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") return;

    await LocalNotifications.requestPermissions().catch(() => {});

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      registerTokenWithServer(token.value);
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("push registration error", err);
    });

    // App was in the foreground when the push arrived — Android won't show a
    // system banner in that case by default, so we surface a local notification.
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const title = notification.title || notification.data?.title || "新消息";
      const body = notification.body || notification.data?.body || "";
      LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title,
            body,
            extra: notification.data || {},
          },
        ],
      }).catch(() => {});
    });

    PushNotifications.addListener("pushNotificationActionPerformed", () => {
      // Tapped a notification while the app was backgrounded — nothing extra
      // needed here since Android just brings the app to the foreground.
    });
  } catch (e) {
    console.warn("push init failed", e);
  }
}

export async function clearPushToken() {
  if (typeof window === "undefined" || !window.Capacitor || !window.Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "granted") {
      // We don't have a stored copy of the token client-side; the simplest
      // correct behavior on logout is to just leave it registered — worst
      // case a signed-out device stops getting pushed to once the session
      // that owned the token is replaced by a new login on that device.
    }
  } catch {
    // ignore
  }
}
