import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

console.log("[Aura Main] Initializing React Root Application...");

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    );
  } catch (err) {
    console.error("[Aura Main] Fatal Error during createRoot.render:", err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #0a0b14; color: #e879a0; font-family: system-ui, sans-serif; text-align: center; padding: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Application Render Error</h1>
        <p style="color: #e2ddd4; max-width: 500px; font-size: 0.95rem;">${err.message || String(err)}</p>
      </div>
    `;
  }
} else {
  console.error("[Aura Main] Fatal Error: #root DOM element not found!");
}
