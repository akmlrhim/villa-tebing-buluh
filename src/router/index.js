import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { applySeo } from "../lib/seo";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      title:
        "Villa Tebing Buluh · Penginapan Bambu di Loksado, Kalimantan Selatan",
      description:
        "Vila bambu privat di lereng Pegunungan Meratus, Loksado, Hulu Sungai Selatan. Cek sendiri tanggal yang masih kosong, lalu booking langsung via WhatsApp.",
    },
  },
  {
    path: "/gallery",
    name: "gallery",
    component: () => import("../views/GalleryView.vue"),
    meta: {
      title: "Galeri Foto Villa Tebing Buluh Loksado",
      description:
        "Foto kamar, gazebo bambu, dan pemandangan Pegunungan Meratus di Villa Tebing Buluh, Loksado — apa adanya, tanpa polesan.",
    },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/AboutView.vue"),
    meta: {
      title: "Tentang Villa Tebing Buluh · Fasilitas & Lokasi di Loksado",
      description:
        "Fasilitas vila, cerita di balik bangunan bambunya, dan cara menuju Villa Tebing Buluh di Hulu Banyu, Loksado, Hulu Sungai Selatan.",
    },
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("../views/ContactView.vue"),
    meta: {
      title: "Kontak & Lokasi Villa Tebing Buluh Loksado",
      description:
        "Alamat, peta, nomor WhatsApp, dan jam operasional admin Villa Tebing Buluh di Jl. Tanuhi, Hulu Banyu, Loksado, Kalimantan Selatan.",
    },
  },
  {
    path: "/pembayaran",
    name: "payment",
    component: () => import("../views/PaymentView.vue"),
    meta: { title: "Pembayaran · Villa Tebing Buluh", noindex: true },
  },
  {
    path: "/cek-booking",
    name: "booking-status",
    component: () => import("../views/BookingStatusView.vue"),
    meta: { title: "Cek Status Booking · Villa Tebing Buluh", noindex: true },
  },

  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("../views/admin/AdminLoginView.vue"),
    meta: { title: "Login Admin · Villa Tebing Buluh", noindex: true },
  },
  {
    path: "/admin",
    component: () => import("../views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, noindex: true },
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
        path: "promo",
        name: "admin-promos",
        component: () => import("../views/admin/AdminPromosView.vue"),
        meta: { title: "Kelola Promo · Admin" },
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

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
    meta: { title: "Halaman tidak ditemukan · Villa Tebing Buluh", noindex: true },
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

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const { initAuth, isAuthenticated } = useAuth();
  await initAuth();
  if (!isAuthenticated.value) {
    return { name: "admin-login", query: { redirect: to.fullPath } };
  }
  return true;
});

router.afterEach((to) => {
  applySeo(to);
});
