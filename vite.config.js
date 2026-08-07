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

function preloadFont() {
  return {
    name: "preload-font",
    enforce: "post",
    transformIndexHtml(html, { bundle }) {
      if (!bundle) return html;
      const font = Object.keys(bundle).find((name) => name.endsWith(".woff2"));
      if (!font) return html;
      return html.replace(
        "</head>",
        `  <link rel="preload" as="font" type="font/woff2" href="/${font}" crossorigin />\n  </head>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), inlineCriticalCss(), preloadFont()],

  server: {
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
