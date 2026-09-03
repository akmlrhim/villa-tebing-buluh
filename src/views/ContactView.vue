<script setup>
import IconGlyph from '../components/IconGlyph.vue';
import PageHero from '../components/PageHero.vue';
import WhatsAppGlyph from '../components/WhatsAppGlyph.vue';
import { useSettings } from '../composables/useSettings';
import { heroImages } from '../data/demoData';
import { generalMessage, waLink } from '../lib/whatsapp';

const { settings, whatsappNumber } = useSettings();

const hero = heroImages.contact;

function formatPhone(number) {
  const rest = number.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
}
</script>

<template>
  <div class="pb-20">
    <PageHero
      :image="hero.url"
      :srcset="hero.srcset"
      :alt="hero.alt"
      title="Hubungi kami"
      subtitle="Paling cepat lewat WhatsApp. Admin biasanya membalas dalam hitungan menit di jam operasional. Telepon juga boleh."
    />

    <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 md:pt-10">
      <div class="grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
        <div>
          <ul class="text-body space-y-5 text-base">
            <li class="flex items-start gap-3.5">
              <IconGlyph
                name="map-pin"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              <span>{{ settings.address }}</span>
            </li>
            <li class="flex items-start gap-3.5">
              <IconGlyph
                name="phone"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              <a
                :href="`tel:+${whatsappNumber}`"
                class="hover:text-ink transition-colors hover:underline"
              >
                {{ formatPhone(whatsappNumber) }}
              </a>
            </li>
            <li class="flex items-start gap-3.5">
              <IconGlyph
                name="clock"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              <span>
                Jam operasional admin: 08.00 – 21.00 WITA<br />
                <span class="text-muted text-sm"
                  >Check-in {{ settings.check_in_time }} · Check-out
                  {{ settings.check_out_time }}</span
                >
              </span>
            </li>
            <li class="flex items-start gap-3.5">
              <IconGlyph
                name="instagram"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              <a
                :href="`https://instagram.com/${settings.instagram}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-ink transition-colors hover:underline"
              >
                @{{ settings.instagram }}
              </a>
            </li>
          </ul>

          <a
            :href="waLink(whatsappNumber, generalMessage())"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-primary hover:bg-primary-active mt-9 inline-flex h-12 items-center gap-2.5 rounded-sm px-6 text-base font-medium text-white transition-colors"
          >
            <WhatsAppGlyph class="h-5 w-5" />
            Chat via WhatsApp
          </a>
          <p class="text-muted mt-3 text-sm">Tanpa template. Tanya apa saja.</p>
        </div>

        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3985.0618275304732!2d115.45236177496967!3d-2.797999597178943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2de59dba146e2ff5%3A0xc5cf7767bd587830!2sVilla%20Tebing%20Buluh!5e0!3m2!1sid!2sid!4v1783431315972!5m2!1sid!2sid"
          class="border-hairline aspect-[4/3] w-full rounded-md border md:aspect-auto md:min-h-[480px]"
          loading="lazy"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          title="Peta lokasi Villa Tebing Buluh"
        />
      </div>
    </div>
  </div>
</template>
