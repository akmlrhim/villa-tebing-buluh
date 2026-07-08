import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
    meta: { title: "Villa Tebing Buluh · Vila Privat di Tepi Tebing Bambu Loksado" },
  },
  {
    path: "/gallery",
    name: "gallery",
    component: () => import("../views/GalleryView.vue"),
    meta: { title: "Our Gallery · Villa Tebing Buluh" },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/AboutView.vue"),
    meta: { title: "About · Villa Tebing Buluh" },
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("../views/ContactView.vue"),
    meta: { title: "Contact · Villa Tebing Buluh" },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 88 };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta.title) document.title = to.meta.title;
});
