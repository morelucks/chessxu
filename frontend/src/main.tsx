import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Connect } from "@stacks/connect-react";
import App from "./app/app";
import "./index.css";
import { Buffer } from "buffer";
import { userSession } from "./zustand/store";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

// Register Service Worker for offline PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <Connect
      authOptions={{
        appDetails: {
          name: "Chessxu",
          icon: window.location.origin + "/logo.png",
        },
        redirectTo: "/",
        onFinish: () => {
          window.location.reload();
        },
        userSession,
      }}
    >
      <App />
    </Connect>
  </StrictMode>
);
