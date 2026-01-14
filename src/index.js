import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 關鍵：這裡呼叫 register() 來啟動離線快取功能
// 如果您只是寫 unregister()，離線功能就不會運作
serviceWorkerRegistration.register();
