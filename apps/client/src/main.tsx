import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element");
}

createRoot(rootElement).render(<App />);

// App-shell service worker (production only): caches the static shell for
// offline loads. Match state rides the WebSocket and is never cached.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // an unavailable service worker must never block the game
    });
  });
}
