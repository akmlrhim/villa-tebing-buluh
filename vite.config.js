import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

function inlineCriticalCss() {
  return {
    name: "inline-critical-css",
    enforce: "post",
    transformIndexHtml(html, { bundle }) {
      if (!bundle) return html;
      return html.replace(
        /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g,
        (match, href) => {
          const fileName = href.replace(/^\//, "");
          const asset = bundle[fileName];
          if (!asset || asset.type !== "asset") return match;
          return `<style>${asset.source}</style>`;
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), inlineCriticalCss()],

  server: {
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
