// 這是 React PWA 的標準註冊腳本
// 它負責檢查瀏覽器是否支援，並將 public/service-worker.js 載入

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === "[::1]" ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  // 檢查是否為生產環境 (Production) 或本地環境，並且瀏覽器支援 Service Worker
  if (process.env.NODE_ENV === "production" || isLocalhost) {
    if ("serviceWorker" in navigator) {
      // 建構 service-worker.js 的路徑
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        // 如果 PUBLIC_URL 與頁面來源不同，Service Worker 無法運作
        return;
      }

      window.addEventListener("load", () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

        if (isLocalhost) {
          // 本地環境：檢查 service worker 是否存在
          checkValidServiceWorker(swUrl, config);

          navigator.serviceWorker.ready.then(() => {
            console.log(
              "此應用程式正由 Service Worker 提供快取服務 (本機模式)。"
            );
          });
        } else {
          // 正式環境：直接註冊
          registerValidSW(swUrl, config);
        }
      });
    }
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // 新內容已下載，但在現有分頁關閉前不會生效
              console.log("有新內容可用，將在所有分頁關閉後生效。");

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // 內容已快取，可離線使用
              console.log("內容已快取，可離線使用。");

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("Service Worker 註冊失敗:", error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // 檢查 Service Worker 檔案是否存在
  fetch(swUrl, {
    headers: { "Service-Worker": "script" },
  })
    .then((response) => {
      // 確保檔案存在且為 JS 檔
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        // 找不到 SW 檔案，可能已移除，重新載入頁面
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // 檔案有效，進行註冊
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log("找不到網際網路連線。應用程式正在離線模式下執行。");
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
