import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// CSS bundle utama kecil (~12KB) tapi tetap jadi request render-blocking
// terpisah yang menunda LCP (ditandai PageSpeed Insights). Inline langsung
// ke <head> index.html menghilangkan round-trip jaringan itu - lebih murah
// daripada fetch terpisah untuk bundle sekecil ini. CSS per-route yang
// dimuat lazy oleh Vue Router (mis. GalleryView-*.css) tidak disentuh,
// karena itu bukan bagian dari <link> awal di index.html.
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), inlineCriticalCss()],
});
