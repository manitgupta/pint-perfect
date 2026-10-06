// Offline-first service worker. VERSION and FILES are filled in by build_app.py.
const VERSION = "dca19d72d5";
const CACHE = "pint-perfect-" + VERSION;
const FILES = [
 "./",
 "app.css",
 "app.js",
 "art/aam-panna-sorbet.svg",
 "art/alphonso-aamras-ice-cream.svg",
 "art/alphonso-mango-shrikhand-froyo.svg",
 "art/amul-protein-shake-pint-hack.svg",
 "art/banana-bread-protein.svg",
 "art/belgian-dark-chocolate-ice-cream.svg",
 "art/black-forest-ice-cream.svg",
 "art/bournvita-malt-protein-thickshake.svg",
 "art/brownie-batter-protein.svg",
 "art/butterscotch-praline-crunch.svg",
 "art/chikoo-malai-protein.svg",
 "art/chocolate-peanut-butter-protein.svg",
 "art/cold-coffee-mocha-chip-protein.svg",
 "art/cookies-and-cream-protein.svg",
 "art/dragon-fruit-protein-smoothie-bowl.svg",
 "art/dulce-de-leche-gelato.svg",
 "art/eggless-cookie-dough-ice-cream.svg",
 "art/epigamia-turbo-chocolate-pint.svg",
 "art/filter-coffee-ice-cream.svg",
 "art/fior-di-latte-gelato.svg",
 "art/fresh-pudina-choc-chip.svg",
 "art/gianduja-gelato.svg",
 "art/guava-chilli-froyo.svg",
 "art/gulab-jamun-ice-cream.svg",
 "art/gulkand-rose-protein.svg",
 "art/honey-anjeer-greek-froyo.svg",
 "art/kala-khatta-gola-sorbet.svg",
 "art/kesar-pista-protein-kulfi.svg",
 "art/litchi-sorbet.svg",
 "art/lotus-biscoff-protein.svg",
 "art/malai-kulfi.svg",
 "art/masala-chai-ice-cream.svg",
 "art/masala-shikanji-sorbet.svg",
 "art/meetha-paan-ice-cream.svg",
 "art/mixed-berry-greek-froyo.svg",
 "art/nagpur-orange-sorbet.svg",
 "art/nolen-gur-gelato.svg",
 "art/pina-colada-protein-froyo.svg",
 "art/rasmalai-paneer-protein-ice-cream.svg",
 "art/real-vanilla-bean-ice-cream.svg",
 "art/rocky-road-ice-cream.svg",
 "art/rose-falooda-protein.svg",
 "art/section-1.svg",
 "art/section-2.svg",
 "art/section-3.svg",
 "art/section-4.svg",
 "art/section-5.svg",
 "art/section-6.svg",
 "art/sicilian-pistachio-gelato.svg",
 "art/sitaphal-ice-cream.svg",
 "art/stracciatella-gelato.svg",
 "art/strawberry-cheesecake-protein.svg",
 "art/tender-coconut-ice-cream.svg",
 "art/thandai-protein.svg",
 "art/tiramisu-gelato.svg",
 "art/watermelon-lime-sorbet.svg",
 "data/book.json",
 "fonts/DMSans.ttf",
 "fonts/Fraunces-Italic.ttf",
 "fonts/Fraunces.ttf",
 "icons/icon-180.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon.svg",
 "index.html",
 "manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pint-perfect-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match("./"));
    })
  );
});
