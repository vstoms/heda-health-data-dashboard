import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "robots.txt"],
      manifest: {
        name: "Heda - Health Data Dashboard",
        short_name: "Heda",
        description:
          "Heda: Your Health Trends. An open source dashboard focused on clarity and actionable insights from your watch data.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "./",
        icons: [
          {
            src: "logo.svg",
            type: "image/svg+xml",
            sizes: "any",
          },
          {
            src: "logo.svg",
            type: "image/svg+xml",
            sizes: "192x192",
            purpose: "any maskable",
          },
          {
            src: "logo.svg",
            type: "image/svg+xml",
            sizes: "512x512",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ["echarts", "echarts-for-react"],
          excel: ["exceljs"],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
