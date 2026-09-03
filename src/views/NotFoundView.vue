<template>
  <div class="grid min-h-dvh place-items-center px-6 text-center">
    <div>
      <p
        class="text-primary text-[clamp(3rem,10vw,6rem)] font-semibold tracking-tight"
      >
        404
      </p>
      <p class="text-ink mt-2 text-lg font-semibold">
        Halaman tidak ditemukan
      </p>
      <p class="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
        Tautan yang kamu buka sudah tidak ada atau alamatnya keliru.
      </p>
      <RouterLink
        to="/"
        class="text-ink hover:text-primary mt-6 inline-block text-sm font-medium underline underline-offset-4 transition-colors"
      >
        Kembali ke beranda
      </RouterLink>
    </div>
  </div>
</template>
