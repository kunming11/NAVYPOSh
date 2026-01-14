// --- 艦艇 POS 離線控制核心 (Service Worker) ---
// 版本號：修改這裡可以強制所有用戶更新快取
const CACHE_NAME = "ship-pos-offline-v3";

// 核心檔案清單：這些檔案會被強制存在手機裡
const ASSETS_TO_CACHE = [
  "/", // 根目錄
  "/index.html", // 主頁面 (React 的入口)
  "/manifest.json", // App 設定檔
  // 注意：CodeSandbox/React 的建置工具會自動處理 JS/CSS 的快取，
  // 這裡我們主要確保 "殼" (App Shell) 能被打開。
];

// 1. 安裝階段 (Install)
// 當瀏覽器第一次看到這個檔案，或版本號變更時觸發
self.addEventListener("install", (event) => {
  console.log("[Service Worker] 安裝中...");

  // 跳過等待，讓新版程式碼立刻接手控制權
  self.skipWaiting();

  // 預先下載並儲存核心檔案
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] 正在快取核心檔案");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error("[Service Worker] 預快取失敗 (非致命):", err);
      });
    })
  );
});

// 2. 啟動階段 (Activate)
// 當 Service Worker 開始運作時觸發，適合清理舊垃圾
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] 啟動中...");

  // 清理舊的快取 (如果版本號變了)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] 刪除舊快取:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // 立刻接管所有開啟的頁面
  self.clients.claim();
});

// 3. 抓取階段 (Fetch)
// 每當 App 發出網路請求（開網頁、抓圖片）時觸發
self.addEventListener("fetch", (event) => {
  // 只處理 http/https 請求 (忽略 chrome-extension 等雜訊)
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    // 策略：網路優先 (Network First)
    // 先嘗試上網抓最新的，如果斷網了，才去讀快取
    fetch(event.request)
      .then((networkResponse) => {
        // 如果上網成功：
        // 1. 複製一份回應 (因為回應流只能用一次)
        const responseToCache = networkResponse.clone();

        // 2. 把新的內容存進快取 (更新離線資料)
        caches.open(CACHE_NAME).then((cache) => {
          // POST 請求 (傳送資料) 不能快取，只快取 GET (讀取資料)
          if (event.request.method === "GET") {
            cache.put(event.request, responseToCache);
          }
        });

        // 3. 回傳網路抓到的最新資料
        return networkResponse;
      })
      .catch(() => {
        // 如果斷網 (Network Error)：
        console.log(
          "[Service Worker] 網路不可用，切換至離線模式:",
          event.request.url
        );

        // 1. 去快取找有沒有這個檔案
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // 2. 離線救命丹 (Offline Fallback)
          // 如果連快取都找不到 (例如您在 /pos 頁面重新整理)，
          // 但這是一個網頁導航請求 (navigate)，那就給他首頁 (index.html)。
          // 因為這是單頁應用 (SPA)，所有頁面其實都是 index.html 變出來的。
          if (event.request.mode === "navigate") {
            return caches.match("/index.html") || caches.match("/");
          }
        });
      })
  );
});
