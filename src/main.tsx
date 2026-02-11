import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "@/App.tsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/i18n";
import "@/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider defaultTheme="system" storageKey="withings-theme">
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
