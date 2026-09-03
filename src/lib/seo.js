export const SITE_URL = 'https://villatebingbuluh.com';
export const SITE_NAME = 'Villa Tebing Buluh';
export const OG_IMAGE = `${SITE_URL}/img/og.jpg`;

const DEFAULT_TITLE = 'Villa Tebing Buluh | Penginapan Bambu di Loksado';
const DEFAULT_DESCRIPTION =
  'Vila bambu privat di lereng Pegunungan Meratus, Loksado, Hulu Sungai Selatan. Cek sendiri tanggal yang masih kosong, lalu booking langsung via WhatsApp.';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = selector.match(/\[(.+?)="(.+?)"\]/);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo(route) {
  const title = route.meta.title ?? DEFAULT_TITLE;
  const description = route.meta.description ?? DEFAULT_DESCRIPTION;
  const canonical = SITE_URL + (route.path === '/' ? '/' : route.path);
  const noindex = route.meta.noindex === true;

  document.title = title;

  setMeta('meta[name="description"]', 'content', description);
  setMeta(
    'meta[name="robots"]',
    'content',
    noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
  );
  setLink('canonical', canonical);

  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[property="og:image"]', 'content', OG_IMAGE);
  setMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
  setMeta('meta[property="og:locale"]', 'content', 'id_ID');
  setMeta('meta[property="og:type"]', 'content', 'website');

  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="twitter:image"]', 'content', OG_IMAGE);
}

function toE164(number) {
  const digits = String(number ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? `+${digits}` : '';
}

function toSchemaTime(value) {
  const match = String(value ?? '').match(/^(\d{1,2})[.:](\d{2})$/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

export function patchLodgingJsonLd(settings) {
  const el = document.getElementById('ld-lodging');
  if (!el) return;

  let data;
  try {
    data = JSON.parse(el.textContent);
  } catch {
    return;
  }

  const telephone = toE164(settings.whatsapp_number);
  if (telephone) data.telephone = telephone;

  if (settings.villa_name) data.name = settings.villa_name;

  const checkinTime = toSchemaTime(settings.check_in_time);
  if (checkinTime) data.checkinTime = checkinTime;

  const checkoutTime = toSchemaTime(settings.check_out_time);
  if (checkoutTime) data.checkoutTime = checkoutTime;

  if (settings.instagram) {
    data.sameAs = [`https://www.instagram.com/${settings.instagram}`];
  }

  el.textContent = JSON.stringify(data);
}

export function createJsonLd(id) {
  let el = null;

  function write(data) {
    if (!data) {
      el?.remove();
      el = null;
      return;
    }
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.dataset.seo = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function remove() {
    el?.remove();
    el = null;
  }

  return { write, remove };
}
