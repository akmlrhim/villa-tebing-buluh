import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useToast } from "../composables/useToast";
// Home dimuat statis (bukan dynamic import) supaya tidak ada round-trip JS
// tambahan sebelum hero LCP dirender - ini halaman yang paling sering jadi
// pintu masuk pertama.
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: "Villa Tebing Buluh · Vila Privat di Tebing Buluh Loksado" },
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
  {
    path: "/pembayaran",
    name: "payment",
    component: () => import("../views/PaymentView.vue"),
    meta: { title: "Pembayaran · Villa Tebing Buluh" },
  },
  {
    path: "/cek-booking",
    name: "booking-status",
    component: () => import("../views/BookingStatusView.vue"),
    meta: { title: "Cek Status Booking · Villa Tebing Buluh" },
  },

  // ---------- Admin ----------
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("../views/admin/AdminLoginView.vue"),
    meta: { title: "Login Admin · Villa Tebing Buluh" },
  },
  {
    path: "/admin",
    component: () => import("../views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: () => import("../views/admin/AdminDashboardView.vue"),
        meta: { title: "Dashboard · Admin" },
      },
      {
        path: "kamar",
        name: "admin-rooms",
        component: () => import("../views/admin/AdminRoomsView.vue"),
        meta: { title: "Kelola Kamar · Admin" },
      },
      {
        path: "booking",
        name: "admin-bookings",
        component: () => import("../views/admin/AdminBookingsView.vue"),
        meta: { title: "Kelola Booking · Admin" },
      },
      {
        path: "booking/:id",
        name: "admin-booking-detail",
        component: () => import("../views/admin/BookingDetailView.vue"),
        meta: { title: "Detail Booking · Admin" },
      },
      {
        path: "galeri",
        name: "admin-gallery",
        component: () => import("../views/admin/AdminGalleryView.vue"),
        meta: { title: "Kelola Galeri · Admin" },
      },
      {
        path: "pengaturan",
        name: "admin-settings",
        component: () => import("../views/admin/AdminSettingsView.vue"),
        meta: { title: "Pengaturan · Admin" },
      },
    ],
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

// Guard admin (F-08.2): tunggu status auth siap, redirect ke login bila perlu.
router.beforeEach(async (to, from) => {
  // Path tak dikenal: batalkan navigasi (tetap di halaman sebelumnya);
  // bila diakses langsung (tidak ada halaman sebelumnya), arahkan ke beranda.
  if (!to.matched.length) {
    useToast().info("Halaman tidak ditemukan.");
    return from.matched.length ? false : { name: "home" };
  }
  if (!to.meta.requiresAuth) return true;
  const { initAuth, isAuthenticated } = useAuth();
  await initAuth();
  if (!isAuthenticated.value) {
    return { name: "admin-login", query: { redirect: to.fullPath } };
  }
  return true;
});

router.afterEach((to) => {
  if (to.meta.title) document.title = to.meta.title;
});
