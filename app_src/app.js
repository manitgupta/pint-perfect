/* Pint Perfect: offline recipe app for the Ninja CREAMi book. Plain JS, no build step. */
(() => {
  "use strict";

  // ------------------------------------------------------------------ helpers
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const view = $("#view");

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    spin: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
    cart: '<path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    egg: '<path d="M12 3c3.6 0 6.5 5.6 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.6 8.4 3 12 3z"/><circle cx="12" cy="14" r="2.6"/>',
    snow: '<path d="M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11"/><path d="M9.5 3.5 12 5.5l2.5-2M9.5 20.5 12 18.5l2.5 2"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    book: '<path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h9"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    blender: '<path d="M7 3h10l-1.5 11h-7z"/><path d="M8.5 14h7l.8 7H7.7z"/><path d="M12 17.5h.01"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    sweet: '<path d="M4 15l8-11 8 11a8 8 0 0 1-16 0z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    box: '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
    scale: '<path d="M12 3v18M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    save: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    heartbeat: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  };
  const ic = (n, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

  // ------------------------------------------------------------------ state
  // v2 adds per-recipe version choice (ver), the global "My version" (myver) and the diabetic gum toggle (gum).
  // Ticks/done keys stay "slug" for Default and become "slug|gym" / "slug|diabetic" for the variants.
  const KEY = "pp:v2", OLD_KEYS = ["pp:v1"];
  const DEFAULTS = { favs: {}, ratings: {}, notes: {}, made: {}, ticks: {}, done: {}, freezer: [], pantry: {}, recent: [], dismissInstall: false, per: "pint",
    ver: {}, myver: "default", gum: {} };
  const VIDS = ["default", "gym", "diabetic"];
  const VLABEL = { default: "Default", gym: "Gym", diabetic: "Diabetic" };
  const migrate = (d) => {
    const out = Object.assign({}, DEFAULTS, d && typeof d === "object" ? d : {});
    for (const k of ["favs", "ratings", "notes", "made", "ticks", "done", "pantry", "ver", "gum"]) if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {};
    for (const k of ["freezer", "recent"]) if (!Array.isArray(out[k])) out[k] = [];
    if (!VIDS.includes(out.myver)) out.myver = "default";
    return out;
  };
  let S;
  try {
    let raw = localStorage.getItem(KEY), migrated = false;
    if (raw === null) for (const k of OLD_KEYS) { raw = localStorage.getItem(k); if (raw !== null) { migrated = true; break; } }
    S = migrate(JSON.parse(raw || "{}"));
    if (migrated) localStorage.setItem(KEY, JSON.stringify(S));
  } catch { S = migrate({}); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  let BOOK, R = {}, ORDER = [], SECT = {};
  const HOME = { q: "", f: new Set(), p: new Set(), sort: "book" };
  const DAY = 24 * 3600 * 1000;

  // ------------------------------------------------------------------ text
  let PW_RE;
  function rich(t) {
    return esc(t).replace(PW_RE, '<span class="pw">$1</span>');
  }
  const PROG_LABEL = (p) => p.charAt(0) + p.slice(1).toLowerCase();
  const progColour = (p) => (BOOK.programs[p.toUpperCase()] || "#666");
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const fmtTime = (ts) => new Date(ts).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9%]+/g, " ").trim();

  // ------------------------------------------------------------------ versions (Default / Gym / Diabetic)
  let HAS_VARIANTS = false;
  const vinfo = (r, vid) => (vid !== "default" && r.versions && r.versions[vid]) || null;
  const usable = (r, vid) => vid === "default" || !!(vinfo(r, vid) && !vinfo(r, vid).unsuitable);
  const diabeticOk = (r) => usable(r, "diabetic") && !!vinfo(r, "diabetic");
  // The merged recipe for a version (cached). Falls back to Default if the version is missing or unsuitable.
  function V(r, vid) {
    if (!usable(r, vid)) vid = "default";
    r._v = r._v || {};
    if (!r._v[vid]) r._v[vid] = vid === "default" ? Object.assign({}, r, { _vid: "default" }) : Object.assign({}, r, vinfo(r, vid), { _vid: vid, egg_option: null });
    return r._v[vid];
  }
  // The version the global "My version" preference points at, falling back to Gym / Default when unsuitable.
  function prefVid(r) {
    if (S.myver === "diabetic") return usable(r, "diabetic") && vinfo(r, "diabetic") ? "diabetic" : vinfo(r, "gym") ? "gym" : "default";
    if (S.myver === "gym" && vinfo(r, "gym")) return "gym";
    return "default";
  }
  const listV = (r) => V(r, prefVid(r)); // what lists, sorts and filters use
  // The version a recipe page opens on: deep link > remembered choice > My version.
  function openVid(r, want) {
    for (const v of [want, S.ver[r.slug]]) if (v === "default" || (v && vinfo(r, v))) return v;
    return prefVid(r);
  }
  const tkey = (slug, vid) => (vid && vid !== "default" ? `${slug}|${vid}` : slug);
  const gumOn = (rv) => rv._vid === "diabetic" && !!rv.gum_option && !!S.gum[rv.slug];
  const ingList = (rv) => (gumOn(rv) ? [...rv.ingredients, Object.assign({}, rv.gum_option, { gum: true })] : rv.ingredients);
  const hasGum = (rv) => [...rv.ingredients, ...(rv.mixins || [])].some((x) => /xanthan|guar/i.test(x.item));
  const added = (n) => (typeof n.added_sugar_g === "number" ? n.added_sugar_g : null);

  // ------------------------------------------------------------------ search
  const SYN = [
    ["diabetic", "sugar free", "sugarfree", "keto", "no sugar", "no added sugar"], ["gym", "lean", "macro", "macros", "high protein"],
    ["munkito", "allulose", "monk fruit", "monkfruit"],
    ["kesar", "saffron"], ["pista", "pistachio"], ["aam", "mango", "alphonso", "aamras", "kesar mango"], ["elaichi", "cardamom"],
    ["choco", "chocolate", "cocoa", "brownie"], ["dahi", "curd", "yogurt", "yoghurt", "greek", "skyr", "froyo", "shrikhand"],
    ["nimbu", "lemon", "lime", "shikanji"], ["santra", "orange"], ["chikoo", "chiku", "sapota"], ["sitaphal", "custard apple"],
    ["badam", "almond"], ["kaju", "cashew"], ["anjeer", "fig"], ["gulab", "rose", "gulkand", "rooh afza"], ["paneer", "cottage cheese"],
    ["coffee", "kaapi", "mocha", "espresso", "tiramisu"], ["chai", "tea"], ["jamun", "kala khatta"], ["coconut", "nariyal", "pina colada"],
    ["litchi", "lychee"], ["strawberry", "berry", "berries", "blueberry"], ["peanut", "pb", "peanut butter"], ["protein", "whey", "turbo"],
    ["vegan", "dairy free", "sorbet"], ["egg", "eggs", "yolk", "custard"], ["gur", "jaggery", "nolen"], ["kulfi", "malai", "rabdi"],
    ["biscuit", "cookie", "oreo", "biscoff"], ["kids", "kid favourite"], ["party", "party pint"], ["cold", "milkshake", "thickshake", "shake"],
  ];
  function expand(tok) {
    const alts = new Set([tok]);
    if (tok.length < 2) return alts;
    for (const g of SYN) if (g.some((w) => w === tok || (tok.length >= 3 && w.startsWith(tok)))) g.forEach((w) => alts.add(w));
    return alts;
  }
  function indexRecipe(r) {
    const s = SECT[r.section];
    const vs = ["gym", "diabetic"].map((k) => vinfo(r, k)).filter((v) => v && !v.unsuitable);
    const ing = [...r.ingredients, ...(r.mixins || []), ...vs.flatMap((v) => [...(v.ingredients || []), ...(v.mixins || []), ...(v.gum_option ? [v.gum_option] : [])])];
    const vtags = [vinfo(r, "gym") ? "gym lean macro" : "", diabeticOk(r) ? "diabetic sugar free" : "", ...vs.map((v) => (v.tags || []).join(" "))].join(" ");
    r._i = {
      t: " " + norm(r.title),
      s: " " + norm([r.subtitle, r.tags.join(" "), r.program, s.title, s.sub, vtags].join(" ")),
      i: " " + norm(ing.map((x) => x.item + " " + (x.note || "")).join(" ")),
      x: " " + norm([r.intro, r.steps.map((x) => x.text).join(" "), r.tips.join(" "), r.swaps.join(" "), r.egg_option ? "egg yolk custard " + r.egg_option.text : "",
        ...["gym", "diabetic"].map((k) => (vinfo(r, k) || {}).why || "")].join(" ")),
    };
  }
  function score(r, toks) {
    let total = 0;
    for (const alts of toks) {
      let best = 0;
      for (const a of alts) {
        const w = " " + a;
        let s = 0;
        if (r._i.t.includes(w)) s = 12; else if (r._i.t.includes(a)) s = 8;
        else if (r._i.s.includes(w)) s = 5; else if (r._i.i.includes(w)) s = 4;
        else if (r._i.s.includes(a) || r._i.i.includes(a)) s = 2; else if (r._i.x.includes(w)) s = 1;
        if (a !== alts.values().next().value) s *= 0.8; // synonyms rank just below direct hits
        best = Math.max(best, s);
      }
      if (!best) return 0;
      total += best;
    }
    return total;
  }

  const FILTERS = [
    { id: "protein", label: "High protein", test: (r) => listV(r).nutrition_per_pint.protein_g >= 30 },
    { id: "lean", label: "Under 450 kcal", test: (r) => listV(r).nutrition_per_pint.kcal < 450 },
    { id: "diabetic", label: "Diabetic-friendly", test: diabeticOk, vonly: true },
    { id: "nosugar", label: "No added sugar", test: (r) => added(listV(r).nutrition_per_pint) === 0 },
    { id: "nogum", label: "No gums", test: (r) => !hasGum(listV(r)) },
    { id: "quick", label: "10-min prep", test: (r) => !r.cook_min && r.prep_min <= 10 },
    { id: "nocook", label: "No-cook", test: (r) => !r.cook_min },
    { id: "vegan", label: "Vegan", test: (r) => r.tags.includes("Vegan") },
    { id: "egg", label: "Egg option", test: (r) => !!r.egg_option },
    { id: "mixin", label: "Mix-ins", test: (r) => (r.mixins || []).length > 0 },
    { id: "desi", label: "Desi", test: (r) => r.tags.includes("Desi Classic") },
    { id: "kids", label: "Kids & parties", test: (r) => r.tags.includes("Kid Favourite") || r.tags.includes("Party Pint") },
  ];
  const PROGS = ["ICE CREAM", "LITE ICE CREAM", "GELATO", "SORBET", "SMOOTHIE BOWL", "MILKSHAKE"];
  const SORTS = { book: "Book order", protein: "Most protein", kcal: "Fewest calories", quick: "Quickest" };

  function results() {
    const toks = norm(HOME.q).split(" ").filter(Boolean).map(expand);
    let list = ORDER.map((slug) => R[slug]);
    list = list.filter((r) => [...HOME.f].every((id) => FILTERS.find((f) => f.id === id).test(r)));
    if (HOME.p.size) list = list.filter((r) => HOME.p.has(r.program));
    if (toks.length) {
      list = list.map((r) => [r, score(r, toks)]).filter(([, s]) => s > 0);
      if (HOME.sort === "book") list.sort((a, b) => b[1] - a[1] || a[0].num - b[0].num);
      list = list.map(([r]) => r);
    }
    const np = (r) => listV(r).nutrition_per_pint;
    const by = { protein: (a, b) => np(b).protein_g - np(a).protein_g,
      kcal: (a, b) => np(a).kcal - np(b).kcal,
      quick: (a, b) => (a.prep_min + (a.cook_min || 0)) - (b.prep_min + (b.cook_min || 0)) }[HOME.sort];
    if (by) list = [...list].sort(by);
    return { list, toks };
  }

  function highlight(title, toks) {
    let out = esc(title);
    for (const alts of toks) {
      for (const a of alts) {
        if (a.length < 2) continue;
        const re = new RegExp("(" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "i");
        if (re.test(out)) { out = out.replace(re, "<mark>$1</mark>"); break; }
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ fragments
  function row(r, toks) {
    const rv = listV(r), n = rv.nutrition_per_pint;
    return `<a class="row" href="#/r/${r.slug}" style="--tint:${r.tint}">
      <div class="thumb"><img src="art/${r.slug}.svg" alt="" width="62" height="62" loading="lazy"></div>
      <div class="txt"><h4>${toks ? highlight(r.title, toks) : esc(r.title)}</h4><div class="st">${esc(r.subtitle)}</div>
        <div class="meta">${rv._vid !== "default" ? `<span class="vtag v-${rv._vid}">${VLABEL[rv._vid]}</span>` : ""}<span class="prog" style="--pc:${progColour(rv.program)}"><i></i>${esc(PROG_LABEL(rv.program))}</span>
        <span class="p">${n.protein_g} g protein</span><span>${n.kcal} kcal</span>${r.egg_option ? ic("egg", "ic egg-dot") : ""}</div></div>
      ${S.favs[r.slug] ? ic("heart", "ic fav") : ""}</a>`;
  }
  const mini = (r) => `<a class="mini" href="#/r/${r.slug}" style="--tint:${r.tint}"><div class="thumb"><img src="art/${r.slug}.svg" alt="" loading="lazy"></div><h4>${esc(r.title)}</h4></a>`;
  const navbar = (title, right = "") => `<div class="navbar" id="navbar"><button class="circ" data-act="back" aria-label="Back">${ic("back")}</button><div class="t">${esc(title)}</div><div class="right">${right || '<span style="width:38px"></span>'}</div></div>`;

  // ------------------------------------------------------------------ home
  function renderHome() {
    const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    view.innerHTML = `
      <header class="hdr"><div class="eyebrow">${ORDER.length} Ninja CREAMi recipes</div><h1 class="big-title">Pint <em>Perfect</em></h1></header>
      ${!standalone && ios && !S.dismissInstall ? `<div class="install">${ic("save")}<div><b>Install it:</b> tap ${ic("share", "ic share")} Share, then <b>Add to Home Screen</b>. Works fully offline.</div><button class="x" data-act="dismiss-install" aria-label="Dismiss">${ic("x")}</button></div>` : ""}
      <div class="search-wrap flat" id="sw"><label class="search">${ic("search")}<input id="q" type="search" placeholder="Search mango, kesar, whey, vegan…" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" value="${esc(HOME.q)}">
        <button class="clear" data-act="clear-q" aria-label="Clear" ${HOME.q ? "" : "hidden"}>${ic("x")}</button></label></div>
      <div class="chips" id="chips">${chips()}</div>
      ${HAS_VARIANTS ? `<div class="myver" id="myver-home">${myverCtl()}</div>` : ""}
      <div id="res"></div>`;
    renderResults();
    const q = $("#q");
    q.addEventListener("input", () => { HOME.q = q.value; $('[data-act="clear-q"]').hidden = !q.value; renderResults(); });
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") q.blur(); });
  }
  function chips() {
    const f = FILTERS.filter((x) => HAS_VARIANTS || !x.vonly).map((x) => `<button class="chip ${HOME.f.has(x.id) ? "on" : ""}" data-f="${x.id}">${esc(x.label)}</button>`).join("");
    const p = PROGS.map((x) => `<button class="chip ${HOME.p.has(x) ? "on" : ""}" data-p="${x}" style="--pc:${progColour(x)}"><span class="dot"></span>${esc(PROG_LABEL(x))}</button>`).join("");
    return f + '<span class="chip-sep"></span>' + p;
  }
  const myverCtl = () => `<span class="lbl">My version</span><div class="seg">${VIDS.map((k) => `<button data-myver="${k}" class="${S.myver === k ? "on" : ""}">${VLABEL[k]}</button>`).join("")}</div>`;
  function setMyver(k) {
    S.myver = k; S.ver = {}; save();
    $$("[data-myver]").forEach((b) => b.classList.toggle("on", b.dataset.myver === k));
    if ((location.hash || "").startsWith("#/guide")) route(true); else renderResults();
    toast(k === "default" ? "Showing the Default recipes" : `Recipes open on the ${VLABEL[k]} version`);
  }
  function renderResults() {
    const res = $("#res");
    if (!res) return;
    const browsing = !HOME.q.trim() && !HOME.f.size && !HOME.p.size;
    if (browsing) {
      const secs = BOOK.sections.map((s) => `<a class="sec-card" href="#/s/${s.num}" style="--sc:${s.colour};--st:${s.tint}">
          <div class="n">${String(s.num).padStart(2, "0")}</div><img src="art/section-${s.num}.svg" alt="" loading="lazy"><h3>${esc(s.title)}</h3><p>${esc(s.sub)}</p></a>`).join("");
      const favs = Object.entries(S.favs).sort((a, b) => b[1] - a[1]).map(([k]) => R[k]).filter(Boolean);
      const recent = S.recent.map((k) => R[k]).filter(Boolean);
      const groups = BOOK.sections.map((s) => `<div class="group-h" style="--sc:${s.colour}"><span class="n">${String(s.num).padStart(2, "0")}</span><h3>${esc(s.title)}</h3><small>${s.recipes.length}</small></div>
          <div class="list">${s.recipes.map((k) => row(R[k])).join("")}</div>`).join("");
      res.innerHTML = `
        <section class="block"><div class="block-h"><h2>Sections</h2></div><div class="rail">${secs}</div></section>
        ${favs.length ? `<section class="block"><div class="block-h"><h2>Saved</h2><a class="more" href="#/saved">See all</a></div><div class="rail">${favs.slice(0, 10).map(mini).join("")}</div></section>` : ""}
        ${recent.length ? `<section class="block"><div class="block-h"><h2>Recently viewed</h2></div><div class="rail">${recent.slice(0, 10).map(mini).join("")}</div></section>` : ""}
        <section class="block"><div class="block-h"><h2>All recipes</h2></div>${groups}</section>`;
    } else {
      const { list, toks } = results();
      const opts = Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${HOME.sort === k ? "selected" : ""}>${v}</option>`).join("");
      res.innerHTML = list.length
        ? `<div class="count"><span>${list.length} recipe${list.length === 1 ? "" : "s"}</span><select id="sort" aria-label="Sort">${opts}</select></div>
           <div class="list">${list.map((r) => row(r, toks.length ? toks : null)).join("")}</div>`
        : `<div class="empty"><img src="art/section-6.svg" alt=""><h3>No pints match</h3><p>Try another word (Hindi names work too: kesar, aam, elaichi) or clear a filter.</p></div>`;
      const sort = $("#sort");
      if (sort) sort.addEventListener("change", () => { HOME.sort = sort.value; renderResults(); });
    }
  }

  // ------------------------------------------------------------------ section
  function renderSection(num) {
    const s = SECT[num];
    if (!s) return renderHome();
    view.innerHTML = `${navbar(s.title)}
      <div class="sec-hero" style="--sc:${s.colour};--st:${s.tint}"><div class="n">${String(s.num).padStart(2, "0")}</div><img src="art/section-${s.num}.svg" alt="">
        <h1>${esc(s.title)}</h1><div class="s">${esc(s.sub)}</div><p>${esc(s.blurb)}</p></div>
      <div class="list" style="margin-top:16px">${s.recipes.map((k) => row(R[k])).join("")}</div>`;
  }

  // ------------------------------------------------------------------ recipe
  let TAB = "ing";
  let VID = "default"; // version shown on the open recipe page
  function renderRecipe(slug, want) {
    const r = R[slug];
    if (!r) return renderHome();
    S.recent = [slug, ...S.recent.filter((k) => k !== slug)].slice(0, 12);
    VID = openVid(r, want);
    if (want && want === VID) rememberVid(r, VID);
    save();
    const s = SECT[r.section];
    const fav = !!S.favs[slug];
    const time = `${r.prep_min} min` + (r.cook_min ? ` + ${r.cook_min}` : "");
    const vids = VIDS.filter((k) => k === "default" || vinfo(r, k));
    view.innerHTML = `${navbar(r.title, `<button class="circ" data-act="share" aria-label="Share">${ic("share")}</button><button class="circ ${fav ? "faved" : ""}" data-act="fav" aria-label="Save">${ic("heart")}</button>`)}
      <article class="recipe" style="--deep:${r.deep};--base:${r.base};--tint:${r.tint};--tint2:${r.tint2}">
        <div class="r-hero">
          <img class="r-art" src="art/${r.slug}.svg" alt="">
          <div class="r-kicker"><span class="no">No. ${String(r.num).padStart(2, "0")}</span>${esc(s.title)}</div>
          <h1 class="r-title">${esc(r.title)}</h1><p class="r-sub">${esc(r.subtitle)}</p>
          <div class="r-tags" id="rtags"></div>
        </div>
        <div class="stats"><div><b>${esc(time)}</b><span>+ 24 h freeze</span></div><div><b>${esc(r.difficulty)}</b><span>difficulty</span></div><div><b>Serves ${r.servings}</b><span>1 pint · 473 ml</span></div></div>
        ${vids.length > 1 ? `<div class="vseg-wrap"><div class="seg vseg" id="vseg" role="tablist" aria-label="Version">${vids.map((k) =>
          `<button data-ver="${k}" class="v-${k}${usable(r, k) ? "" : " un"}" role="tab">${VLABEL[k]}</button>`).join("")}</div></div>` : ""}
        <div class="prog-row" id="prog"></div>
        <div class="nutri" id="nutri"></div>
        <p class="intro">${rich(r.intro)}</p>
        <div class="tabs-r"><div class="seg" id="rtabs">
          ${[["ing", "Ingredients"], ["method", "Method"], ["tips", "Tips"], ["notes", "Notes"]].map(([k, v]) => `<button data-tab-r="${k}" class="${TAB === k ? "on" : ""}">${v}</button>`).join("")}
        </div></div>
        <div class="panel" id="panel"></div>
        <p class="foot">Page ${r.page} in your printed book${vids.length > 1 ? " (Default version)" : ""}</p>
      </article>`;
    renderVersion(r);
  }
  function rememberVid(r, vid) {
    if (vid === prefVid(r)) delete S.ver[r.slug]; else S.ver[r.slug] = vid;
  }
  const recipeHash = (slug, vid) => `#/r/${slug}` + (vid && vid !== "default" ? `?v=${vid}` : "");
  function setVersion(r, vid) {
    if (vid === VID) return;
    VID = vid; rememberVid(r, vid); save();
    const h = recipeHash(r.slug, vid);
    try { history.replaceState(history.state, "", h); } catch {}
    if (stack.length && stack[stack.length - 1] === current) stack[stack.length - 1] = h;
    current = h;
    renderVersion(r);
  }
  function renderVersion(r) {
    const ok = usable(r, VID), rv = V(r, VID);
    $("#rtags").innerHTML = rv.tags.map((t) => `<span>${esc(t)}</span>`).join("");
    $$("#vseg button").forEach((b) => { b.classList.toggle("on", b.dataset.ver === VID); b.setAttribute("aria-selected", b.dataset.ver === VID); });
    const prog = $("#prog");
    prog.hidden = !ok;
    prog.innerHTML = `<span class="prog-pill" style="--pc:${progColour(rv.program)}">${esc(rv.program)}</span><span>${esc(rv.respin)}</span>`;
    renderNutri(r);
    renderPanel(r);
  }
  function unsuitCard(r) {
    const u = vinfo(r, "diabetic"), t = u.try && R[u.try];
    return `<div class="unsuit"><div class="nutri-h"><span>No diabetic version</span></div><p>${rich(u.why)}</p>
      ${t ? `<a class="try" href="${recipeHash(t.slug, usable(t, "diabetic") && vinfo(t, "diabetic") ? "diabetic" : "default")}" style="--tint:${t.tint}"><span class="thumb"><img src="art/${t.slug}.svg" alt=""></span>
        <span class="txt"><small>Try this instead</small><b>${esc(t.title)}</b></span>${ic("chev", "ic chev")}</a>` : ""}
      ${vinfo(r, "gym") ? `<button class="btn ghost" data-ver="gym">${ic("bolt")}See the lower-sugar Gym version</button>` : ""}</div>`;
  }
  function renderNutri(r) {
    const el = $("#nutri");
    if (!usable(r, VID)) { el.innerHTML = unsuitCard(r); return; }
    const rv = V(r, VID), n = rv.nutrition_per_pint, d = S.per === "pint" ? 1 : r.servings;
    const v = (x) => Math.round(x / d);
    const as = added(n), das = added(r.nutrition_per_pint);
    el.innerHTML = `<div class="nutri-h"><span>Nutrition${rv._vid !== "default" ? ` · ${VLABEL[rv._vid]}` : ""}</span><div class="seg"><button data-per="pint" class="${S.per === "pint" ? "on" : ""}">Per pint</button><button data-per="serv" class="${S.per !== "pint" ? "on" : ""}">Per serving</button></div></div>
      <div class="n-grid"><div class="np"><b>${v(n.protein_g)}<u>g</u></b><span>protein</span></div><div><b>${v(n.kcal)}</b><span>kcal</span></div><div><b>${v(n.carbs_g)}<u>g</u></b><span>carbs</span></div><div><b>${v(n.fat_g)}<u>g</u></b><span>fat</span></div></div>
      ${as !== null ? `<div class="n-sugar"><span>Added sugar</span><b>${v(as)} g</b>${rv._vid !== "default" && das !== null && das !== as ? `<s>${v(das)} g</s>` : ""}</div>` : ""}`;
  }
  function eggCallout(r) {
    const e = r.egg_option;
    if (!e) return "";
    return `<div class="callout egg">${ic("egg")}<div><h4>With eggs (optional)</h4><b>${esc(e.title)}.</b> ${rich(e.text)}${e.adds ? `<br><span class="egg-adds">${esc(e.adds)}</span>` : ""}</div></div>`;
  }
  const chgBadge = (x) => (x.changed ? `<span class="chg">${x.was ? "changed" : "added"}</span>` : x.gum ? '<span class="chg">optional</span>' : "");
  function renderPanel(r) {
    const p = $("#panel");
    const ok = usable(r, VID), rv = V(r, VID), key = tkey(r.slug, rv._vid);
    if (!ok && (TAB === "ing" || TAB === "method")) {
      p.innerHTML = `<div class="card"><div class="v-empty">There's no diabetic version of this pint (see above). Switch to ${vinfo(r, "gym") ? "Default or Gym" : "Default"} for the ingredients and method.</div></div>`;
      return;
    }
    const ticks = new Set(S.ticks[key] || []);
    const done = new Set(S.done[key] || []);
    const ingLi = (items, pre) => items.map((x, i) => `<li data-tick="${pre}${i}" class="${ticks.has(pre + i) ? "on" : ""}${x.changed || x.gum ? " changed" : ""}"><span class="ck">${ic("check")}</span>
        <div class="body"><span class="q">${esc(x.qty)}</span> <span class="it">${esc(x.item)}</span>${chgBadge(x)}${x.note ? `<small>${esc(x.note)}</small>` : ""}${x.was ? `<small class="was">was <s>${esc(x.was)}</s></small>` : ""}</div></li>`).join("");
    const why = rv._vid !== "default" && rv.why ? `<div class="callout vwhy v-${rv._vid}">${ic(rv._vid === "gym" ? "bolt" : "sweet")}<div><h4>${VLABEL[rv._vid]} version</h4>${rich(rv.why)}</div></div>` : "";
    const gum = rv._vid === "diabetic" && rv.gum_option ? `<div class="gum-row"><span>Gum</span><div class="seg"><button data-gum="0" class="${gumOn(rv) ? "" : "on"}">No gum</button><button data-gum="1" class="${gumOn(rv) ? "on" : ""}">With xanthan</button></div></div>` : "";
    if (TAB === "ing") {
      p.innerHTML = `${why}<div class="card"><div class="card-h"><h3>Ingredients</h3>${ticks.size ? '<button data-act="clear-ticks">Clear ticks</button>' : ""}</div><ul class="ing">${ingLi(ingList(rv), "i")}</ul>${gum}</div>
        ${rv.mixins && rv.mixins.length ? `<div class="card"><div class="card-h"><h3>Mix-ins</h3></div><ul class="ing">${ingLi(rv.mixins, "m")}</ul></div>` : ""}
        <div class="btns"><button class="btn ghost" data-act="shoplist">${ic("cart")}Shopping list</button><button class="btn primary" data-act="tab-method">${ic("list")}Method</button></div>
        ${r.shop_note ? `<div class="callout shop" style="margin-top:12px">${ic("cart")}<div><h4>Where to buy</h4>${rich(r.shop_note)}</div></div>` : ""}`;
    } else if (TAB === "method") {
      p.innerHTML = `<button class="btn primary" data-act="cook">${ic("play")}Start cook mode</button>
        <div class="card"><div class="card-h"><h3>Method${rv._vid !== "default" ? ` · ${VLABEL[rv._vid]}` : ""}</h3>${done.size ? '<button data-act="clear-done">Reset</button>' : ""}</div><ol class="steps">
        ${rv.steps.map((st, i) => { const t = BOOK.steps[st.tag] || { label: st.tag, colour: "#666" };
          return `<li data-step="${i}" class="${done.has(i) ? "on" : ""}${st.changed ? " changed" : ""}"><span class="num">${done.has(i) ? ic("check") : i + 1}</span><div class="txt"><span class="stag" style="--tc:${t.colour}">${esc(t.label)}</span>${st.changed ? '<span class="chg">changed</span>' : ""}${rich(st.text)}</div></li>`; }).join("")}
        </ol></div>
        ${gumOn(rv) ? `<div class="callout vwhy v-diabetic" style="margin-top:12px">${ic("sweet")}<div><h4>With xanthan</h4>Add ${esc(rv.gum_option.qty)} ${esc(rv.gum_option.item)} with the other ingredients before you Blast.</div></div>` : ""}
        ${rv.egg_option ? `<div style="margin-top:12px">${eggCallout(rv)}</div>` : ""}
        <button class="btn ghost" data-act="freeze" style="margin-top:12px">${ic("snow")}It's in the freezer: start 24 h timer</button>`;
    } else if (TAB === "tips") {
      p.innerHTML = `<div class="callout tips">${ic("bulb")}<div><h4>Pro tips</h4><ul>${r.tips.map((t) => `<li>${rich(t)}</li>`).join("")}</ul></div></div>
        <div class="callout swaps">${ic("swap")}<div><h4>Swaps &amp; twists</h4><ul>${r.swaps.map((t) => `<li>${rich(t)}</li>`).join("")}</ul></div></div>
        ${rv.egg_option ? `<div style="margin-top:12px">${eggCallout(rv)}</div>` : ""}`;
    } else {
      const rating = S.ratings[r.slug] || 0;
      const made = S.made[r.slug] || [];
      p.innerHTML = `<div class="card"><div class="card-h"><h3>Your rating</h3></div><div class="stars" style="padding:0 10px 10px">
          ${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" class="${n <= rating ? "on" : ""}" aria-label="${n} stars">${ic("star")}</button>`).join("")}</div></div>
        <div class="card"><div class="card-h"><h3>Made it</h3><button data-act="made">+ Today</button></div>
          <div class="made">${made.length ? `Made ${made.length} time${made.length === 1 ? "" : "s"}<ul>${made.slice().reverse().map((t) => `<li>${fmtDate(t)}</li>`).join("")}</ul>` : "Not yet. Tap “+ Today” when you spin a pint."}</div></div>
        <div class="card"><div class="card-h"><h3>Notes</h3></div><textarea class="notes-area" id="notes" placeholder="Tweaks, brands, how many re-spins your freezer needs…">${esc(S.notes[r.slug] || "")}</textarea></div>`;
      const ta = $("#notes");
      ta.addEventListener("input", () => { S.notes[r.slug] = ta.value; save(); });
    }
  }

  // ------------------------------------------------------------------ cook mode
  let wakeLock = null;
  async function lockScreen() {
    try { if ("wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); return true; } } catch {}
    return false;
  }
  function cookMode(r) {
    let i = 0;
    document.body.classList.add("cookmode-open");
    const el = document.createElement("div");
    el.className = "cook";
    el.style.cssText = `--deep:${r.deep}`;
    document.body.appendChild(el);
    let locked = false;
    lockScreen().then((ok) => { locked = ok; draw(); });
    draw();
    const onVis = () => { if (document.visibilityState === "visible" && el.isConnected) lockScreen(); };
    document.addEventListener("visibilitychange", onVis);
    function close() {
      el.remove(); document.body.classList.remove("cookmode-open");
      document.removeEventListener("visibilitychange", onVis);
      if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    }
    function draw() {
      const st = r.steps[i], t = BOOK.steps[st.tag] || { label: st.tag, colour: "#666" };
      const last = i === r.steps.length - 1;
      el.innerHTML = `<div class="cook-top"><div class="t">${esc(r.title)}${r._vid && r._vid !== "default" ? ` · ${VLABEL[r._vid]}` : ""}</div><button class="circ" data-c="close" aria-label="Close">${ic("x")}</button></div>
        <div class="cook-prog">${r.steps.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>
        <div class="cook-body"><div class="cook-n">Step ${i + 1} of ${r.steps.length} &nbsp;<span class="stag" style="--tc:${t.colour}">${esc(t.label)}</span></div>
          <div class="cook-txt">${rich(st.text)}</div>
          ${st.tag === "FREEZE" ? `<button class="btn ghost" data-c="freeze" style="margin-top:22px">${ic("snow")}Start 24 h freezer timer</button>` : ""}</div>
        <div class="cook-nav"><button class="btn ghost" data-c="prev" ${i === 0 ? "disabled style=opacity:.4" : ""}>${ic("back")}</button>
          <button class="btn primary" data-c="${last ? "done" : "next"}">${last ? "Done" : "Next step"}</button></div>
        <div class="wake">${locked ? "Screen stays on while cook mode is open" : "Tip: swipe left or right to change steps"}</div>`;
    }
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      const c = b.dataset.c;
      if (c === "close") close();
      else if (c === "next") { i = Math.min(i + 1, r.steps.length - 1); draw(); }
      else if (c === "prev") { i = Math.max(i - 1, 0); draw(); }
      else if (c === "done") { close(); toast("Enjoy your pint! 🍨"); }
      else if (c === "freeze") { addFreezer(r.slug, r._vid); }
    });
    let x0 = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 60) return;
      i = dx < 0 ? Math.min(i + 1, r.steps.length - 1) : Math.max(i - 1, 0); draw();
    });
  }

  // ------------------------------------------------------------------ freezer
  function addFreezer(slug, vid) {
    S.freezer.push(Object.assign({ id: Date.now().toString(36), slug, ts: Date.now() }, vid && vid !== "default" ? { v: vid } : {}));
    save(); updateBadge();
    toast(`Timer started. Ready ${fmtTime(Date.now() + DAY)}`, "View", () => { location.hash = "#/freezer"; });
  }
  function renderFreezer() {
    const now = Date.now();
    const items = S.freezer.slice().sort((a, b) => a.ts - b.ts).filter((p) => R[p.slug]);
    view.innerHTML = `<header class="hdr"><div class="eyebrow">24-hour freeze tracker</div><h1 class="big-title">Freezer</h1>
        <p class="sub">Log a pint when it goes in. You'll see when it's ready to spin.</p></header>
      <div class="list" style="margin-top:14px">${items.length ? items.map((p) => {
        const r = R[p.slug], pct = Math.min(1, (now - p.ts) / DAY), ready = pct >= 1;
        const left = p.ts + DAY - now, h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
        return `<div class="pint ${ready ? "ready" : ""}" style="--tint:${r.tint}"><a class="thumb" href="${recipeHash(r.slug, p.v)}"><img src="art/${r.slug}.svg" alt=""></a>
          <div class="txt"><h4>${esc(r.title)}</h4><div class="when">Frozen ${fmtTime(p.ts)} · ${esc(PROG_LABEL(V(r, p.v || "default").program))}${p.v && VLABEL[p.v] ? ` · ${VLABEL[p.v]}` : ""}</div>
          <div class="bar"><i style="width:${Math.round(pct * 100)}%"></i></div><div class="state">${ready ? "Ready to spin" : `Ready in ${h} h ${m} min`}</div></div>
          <div class="acts">${ready ? `<button class="go" data-spun="${p.id}">Spun it</button>` : ""}<button data-rm="${p.id}">Remove</button></div></div>`;
      }).join("") : `<div class="empty"><img src="art/section-1.svg" alt=""><h3>Freezer's empty</h3><p>Start a timer from any recipe's Method tab, or log a pint here.</p></div>`}
      <button class="btn primary" data-act="log-pint" style="margin-top:6px">${ic("plus")}Log a pint</button></div>`;
  }
  function updateBadge() {
    const n = S.freezer.filter((p) => Date.now() - p.ts >= DAY).length;
    const b = $("#freezer-badge");
    b.hidden = !n; b.textContent = n;
  }
  function pickSheet(onPick) {
    const root = $("#sheet-root");
    root.innerHTML = `<div class="sheet-bg" data-sh="close"></div><div class="sheet" role="dialog"><div class="grab"></div><h3>Which pint went in?</h3>
      <div class="search-wrap"><label class="search">${ic("search")}<input id="pq" type="search" placeholder="Search recipes" autocomplete="off"></label></div>
      <div class="scroll"><div class="list" id="plist"></div></div></div>`;
    const draw = (q) => {
      const toks = norm(q).split(" ").filter(Boolean).map(expand);
      const list = ORDER.map((k) => R[k]).filter((r) => !toks.length || score(r, toks) > 0);
      $("#plist").innerHTML = list.map((r) => row(r).replace('<a class="row" href="#/r/' + r.slug + '"', `<a class="row" data-pick="${r.slug}"`)).join("");
    };
    draw("");
    $("#pq").addEventListener("input", (e) => draw(e.target.value));
    root.onclick = (e) => {
      if (e.target.closest('[data-sh="close"]')) { root.innerHTML = ""; return; }
      const p = e.target.closest("[data-pick]");
      if (p) { e.preventDefault(); root.innerHTML = ""; onPick(p.dataset.pick); }
    };
  }

  // ------------------------------------------------------------------ saved
  function renderSaved() {
    const favs = Object.entries(S.favs).sort((a, b) => b[1] - a[1]).map(([k]) => R[k]).filter(Boolean);
    const rated = Object.entries(S.ratings).filter(([k, v]) => v && R[k] && !S.favs[k]).sort((a, b) => b[1] - a[1]).map(([k]) => R[k]);
    const made = Object.entries(S.made).filter(([k, v]) => v.length && R[k]).sort((a, b) => b[1].at(-1) - a[1].at(-1)).map(([k]) => R[k]);
    view.innerHTML = `<header class="hdr"><div class="eyebrow">Your collection</div><h1 class="big-title">Saved</h1></header>
      ${favs.length ? `<div class="list" style="margin-top:14px">${favs.map((r) => row(r)).join("")}</div>`
        : `<div class="empty"><img src="art/${ORDER[2]}.svg" alt=""><h3>Nothing saved yet</h3><p>Tap the heart on any recipe to keep it here.</p></div>`}
      ${rated.length ? `<div class="group-h" style="--sc:#E3A920"><h3>Rated</h3></div><div class="list">${rated.map((r) => row(r)).join("")}</div>` : ""}
      ${made.length ? `<div class="group-h" style="--sc:#15803D"><h3>Made recently</h3></div><div class="list">${made.slice(0, 15).map((r) => row(r)).join("")}</div>` : ""}`;
  }

  // ------------------------------------------------------------------ guide
  const TOPICS = [
    ["start", "Start here", "How this book works", "book", "#D6404E"],
    ["programs", "The programs", "Which CREAMi button, when", "grid", "#2B77B5"],
    ["blast", "The Ninja Blast", "Dos and don'ts", "blender", "#6D28D9"],
    ["method", "Blast to bowl", "The 24 h method + golden rules", "list", "#D0611B"],
    ["pantry", "Pantry checklist", "What to stock, where to buy", "cart", "#0F8077"],
    ["protein", "Protein toolkit", "Whey, Turbo, paneer & more", "bolt", "#3559A8"],
    ["sweet", "Sweeteners", "Munkito, allulose & a converter", "sweet", "#C2366B"],
    ["healthy", "Healthier pints", "Gym & diabetic versions, smart swaps", "heartbeat", "#15803D", "variants_legend"],
    ["hpantry", "Healthy pantry", "What to buy, how to read labels", "leaf", "#0E7490", "healthy_pantry"],
    ["science", "Texture science", "Why low-sugar pints still scoop", "flask", "#7C3AED", "texture_science"],
    ["custard", "Egg-yolk custard 101", "For the optional egg versions", "egg", "#C98F00"],
    ["trouble", "Troubleshooting", "Powdery, icy, too soft…", "wrench", "#A3324F"],
    ["storage", "Storage & conversions", "Leftovers, cups, grams", "scale", "#5C7F2C"],
    ["data", "Your data", "Back up notes & ratings", "save", "#6B7280"],
  ];
  function renderGuide(id) {
    const g = BOOK.guide;
    const topics = TOPICS.filter((t) => !t[5] || g[t[5]]);
    if (!id) {
      view.innerHTML = `<header class="hdr"><div class="eyebrow">Reference</div><h1 class="big-title">Guide</h1><p class="sub">Everything from the front of the printed book.</p></header>
        ${HAS_VARIANTS ? `<div class="myver card-ish" style="margin-top:10px">${myverCtl()}</div><p class="myver-note">Recipes open on this version, and lists show its protein and calories.</p>` : ""}
        <div class="g-list" style="margin-top:12px">${topics.map(([k, t, d, i, c]) => `<a class="g-item" href="#/guide/${k}" style="--gc:${c}"><span class="gi">${ic(i)}</span><div><h4>${esc(t)}</h4><p>${esc(d)}</p></div>${ic("chev", "ic chev")}</a>`).join("")}</div>`;
      return;
    }
    const topic = topics.find((t) => t[0] === id);
    if (!topic) return renderGuide();
    let body = "";
    const card = (inner) => `<div class="card">${inner}</div>`;
    if (id === "start") {
      body = g.welcome.paragraphs.map((p) => `<p>${rich(p)}</p>`).join("") +
        `<h3>On a recipe page</h3>${card(`<div class="kv">
          <div><b>Program</b>The CREAMi button to press, colour-coded across the app.</div>
          ${HAS_VARIANTS ? "<div><b>Default · Gym · Diabetic</b>Every recipe has a leaner, higher-protein Gym version and a no-added-sugar Diabetic version. Switch above the nutrition card, or set My version on the Recipes tab. The printed book shows the Default.</div>" : ""}
          <div><b>Tabs</b>Ingredients you can tick off, a method with tappable steps, tips &amp; swaps, and your own notes.</div>
          <div><b>Cook mode</b>Big-text, one step at a time, with the screen kept awake.</div>
          <div><b>Freezer timer</b>Start it when the pint goes in; the Freezer tab shows when it's ready.</div>
          <div><b>With eggs (optional)</b>Every recipe is eggless as written. Where yolks help, the yellow panel shows how.</div></div>`)}`;
    } else if (id === "programs") {
      body = card(`<div class="kv">${g.programs.map((p) => `<div><span class="prog-pill" style="--pc:${progColour(p.name)}">${esc(p.name)}</span>
        <div class="line"><span class="lbl">Best for</span>${esc(p.best_for)}</div><div class="line"><span class="lbl">Texture</span>${esc(p.texture)}</div><div class="line"><span class="lbl">Use when</span>${esc(p.use_when)}</div></div>`).join("")}</div>`);
    } else if (id === "blast") {
      body = `<p>${rich(g.blast.intro)}</p><h3>Do</h3>${card(`<ul class="dd do">${g.blast.dos.map((x) => `<li>${ic("check")}<span>${rich(x)}</span></li>`).join("")}</ul>`)}
        <h3>Don't</h3>${card(`<ul class="dd dont">${g.blast.donts.map((x) => `<li>${ic("x")}<span>${rich(x)}</span></li>`).join("")}</ul>`)}`;
    } else if (id === "method") {
      body = card(g.how_it_works.map((s, i) => `<div class="rule"><span class="n">${i + 1}</span><div><b>${esc(s.step)}</b><br>${rich(s.text)}</div></div>`).join("") +
        `<div class="rule"><span class="n">★</span><div><b>Plan ahead</b><br>Tonight: blend &amp; freeze. Tomorrow night: spin &amp; serve. Keep 2–3 pints frozen and you never wait.</div></div>`) +
        `<h3>10 golden rules</h3>` + card(g.golden_rules.map((r, i) => `<div class="rule"><span class="n">${String(i + 1).padStart(2, "0")}</span><div><b>${esc(r.title)}</b><br>${rich(r.text)}</div></div>`).join(""));
    } else if (id === "pantry") {
      body = `<p>Tick what you have. Saved on this phone.</p>` + g.pantry.map((c) => `<h3>${esc(c.category)}</h3>${card(`<ul class="ing pan">${c.items.map((it) => {
        const k = c.category + "|" + it.name;
        return `<li data-pan="${esc(k)}" class="${S.pantry[k] ? "on" : ""}"><span class="ck">${ic("check")}</span><div class="body"><span class="it"><b>${esc(it.name)}</b></span><small>${esc(it.use)}</small><span class="where">${esc(it.where)}</span></div></li>`; }).join("")}</ul>`)}`).join("") +
        `<h3>Shopping tips</h3>${card(`<ul class="dd">${g.shopping_tips.map((x) => `<li>${ic("cart")}<span>${rich(x)}</span></li>`).join("")}</ul>`)}`;
    } else if (id === "protein") {
      body = `<p>${rich(g.protein_guide.intro)}</p>` + card(`<div class="kv">${g.protein_guide.rows.map((r) => `<div><b>${esc(r.base)}</b><div class="line"><span class="lbl">Protein</span>${esc(r.protein)}</div><div class="line"><span class="lbl">Texture</span>${esc(r.texture)}</div><div class="line"><span class="lbl">Tip</span>${esc(r.tip)}</div></div>`).join("")}</div>`);
    } else if (id === "sweet") {
      body = `<p>Sugar keeps a pint soft. Swap it out and the pint freezes harder, so expect LITE ICE CREAM and a RE-SPIN. Allulose (Munkito Monk Sweet + Allulose 1:1) is the exception: it keeps pints soft without sugar.</p>
        <h3>Sugar to Munkito converter</h3>${card(`<div class="conv-tool"><label class="sc-in"><input id="sc-g" type="number" inputmode="decimal" min="0" step="5" value="60" aria-label="Sugar in grams"><span>g sugar</span></label>
          <div class="seg"><button data-sconv="lite" class="on">Lite / protein</button><button data-sconv="full">Full-fat / cream</button></div>
          <div class="sc-out" id="sc-out"></div></div>`)}
        <h3>Sweeteners compared</h3>` +
        card(`<div class="kv">${g.sweetener_guide.map((r) => `<div><b>${esc(r.name)}${r.diabetic_ok === true ? ' <span class="okb">Diabetic OK</span>' : r.diabetic_ok === false ? ' <span class="okb no">Not for diabetics</span>' : ""}</b><div class="line"><span class="lbl">vs sugar</span>${esc(r.sweetness)} · <span class="pw">${esc(r.program)}</span></div><div class="line"><span class="lbl">Freezing</span>${esc(r.freeze_effect)}</div><div class="line"><span class="lbl">Tip</span>${esc(r.tip)}</div></div>`).join("")}</div>`);
    } else if (id === "healthy") {
      const L = g.variants_legend, sw = g.healthier_swaps;
      const vcard = (k, x) => x ? `<div class="vcard v-${k}"><div class="vh">${ic(k === "gym" ? "bolt" : "sweet")}<b>${VLABEL[k]}</b></div><p>${rich(x.goal)}</p>${(x.rules || []).length ? `<ul>${x.rules.map((t) => `<li>${rich(t)}</li>`).join("")}</ul>` : ""}</div>` : "";
      body = `${L.intro ? `<p>${rich(L.intro)}</p>` : ""}
        ${HAS_VARIANTS ? `<div class="myver card-ish" style="margin:14px 0 0">${myverCtl()}</div>` : ""}
        <div class="vcards">${vcard("gym", L.gym)}${vcard("diabetic", L.diabetic)}</div>
        ${L.disclaimer ? `<p class="disc">${rich(L.disclaimer)}</p>` : ""}
        ${sw && (sw.rows || []).length ? `<h3>${esc(sw.title || "Healthier swaps")}</h3>${card(`<div class="kv">${sw.rows.map((x) => `<div><div class="swap-l"><s>${esc(x.out)}</s>${ic("chev", "ic")}<b>${esc(x.in)}</b></div>
          <div class="line"><span class="lbl">Effect</span>${rich(x.effect)}</div>${x.saves ? `<div class="line"><span class="lbl">Saves</span>${esc(x.saves)}</div>` : ""}</div>`).join("")}</div>`)}` : ""}
        ${HAS_VARIANTS ? `<h3>Diabetic-friendly recipes</h3><div class="list" style="padding:0">${ORDER.filter((k) => diabeticOk(R[k])).map((k) => row(R[k])).join("")}</div>` : ""}`;
    } else if (id === "hpantry") {
      const hp = g.healthy_pantry, lr = g.label_reading;
      body = `${hp.intro ? `<p>${rich(hp.intro)}</p>` : ""}` + card(`<div class="kv">${(hp.items || []).map((x) => `<div><b>${esc(x.name)}${x.diabetic_ok ? ' <span class="okb">Diabetic OK</span>' : ""}</b>
          ${x.brand ? `<div class="line"><span class="lbl">Buy</span>${esc(x.brand)}</div>` : ""}<div class="line"><span class="lbl">Why</span>${rich(x.why)}</div>
          <div class="line"><span class="lbl">Use</span>${rich(x.use)}</div>${x.where ? `<span class="where">${esc(x.where)}</span>` : ""}</div>`).join("")}</div>`) +
        (lr ? `<h3>${esc(lr.title || "Reading labels")}</h3>${lr.intro ? `<p>${rich(lr.intro)}</p>` : ""}${card(`<div class="kv">${(lr.rows || []).map((x) => `<div><b>${esc(x.code)}</b><div class="line">${rich(x.what)}</div><div class="line"><span class="lbl">Verdict</span>${rich(x.verdict)}</div></div>`).join("")}</div>`)}` : "");
    } else if (id === "science") {
      const ts = g.texture_science;
      body = `${ts.intro ? `<p>${rich(ts.intro)}</p>` : ""}` + card((ts.points || []).map((x, i) => `<div class="rule"><span class="n">${i + 1}</span><div><b>${esc(x.h)}</b><br>${rich(x.text)}</div></div>`).join(""));
    } else if (id === "custard") {
      const steps = [["Whisk", "Yolks and sugar together until pale and thick, about 1 minute."],
        ["Temper", "Heat the milk until steaming, not boiling. Pour a ladleful into the yolks while whisking, then the rest."],
        ["Cook", "Back on low heat, stirring with a spatula, to 80–82 °C: it coats a spoon and a finger-line holds. Above 85 °C it scrambles."],
        ["Cool", "Strain, cool in a bowl set in iced water, then Blast and freeze within 2 hours."]];
      body = `<p>Every recipe works without eggs. ${ORDER.filter((k) => R[k].egg_option).length} recipes have an optional egg-yolk version for a richer, custard-style pint.</p>` +
        card(steps.map(([t, x], i) => `<div class="rule"><span class="n">${i + 1}</span><div><b>${t}</b><br>${esc(x)}</div></div>`).join("")) +
        `<h3>Good to know</h3>${card(`<div class="kv"><div>No thermometer? Cook until the back of the spoon stays coated.</div><div>Slightly grainy? The Blast smooths it out once cool.</div><div>Spare whites: meringues or an omelette.</div></div>`)}
        <h3>Recipes with an egg option</h3><div class="list" style="padding:0">${ORDER.filter((k) => R[k].egg_option).map((k) => row(R[k])).join("")}</div>`;
    } else if (id === "trouble") {
      body = card(`<div class="kv">${g.troubleshooting.map((t) => `<div><b>${esc(t.problem)}</b><div class="line"><span class="lbl">Why</span>${rich(t.why)}</div><div class="line"><span class="lbl">Fix</span>${rich(t.fix)}</div></div>`).join("")}</div>`);
    } else if (id === "storage") {
      body = `<h3>Leftovers</h3>${card(`<ul class="dd">${g.storage.map((x) => `<li>${ic("snow")}<span>${rich(x)}</span></li>`).join("")}</ul>`)}
        <h3>Conversions</h3>${card(g.conversions.map((c) => `<div class="conv"><span>${esc(c.from)}</span><b>${esc(c.to)}</b></div>`).join(""))}`;
    } else if (id === "data") {
      const n = Object.keys(S.notes).filter((k) => S.notes[k]).length, f = Object.keys(S.favs).length, rt = Object.keys(S.ratings).length;
      body = `<p>Your saved recipes, ratings, notes, ticks and freezer log live only on this phone (${f} saved, ${rt} rated, ${n} with notes). Back them up now and then, especially before deleting the app.</p>
        <div class="data-btns" style="margin-top:14px"><button class="btn primary" data-act="export">${ic("save")}Back up to Files</button>
        <label class="btn ghost">${ic("share")}Restore from backup<input type="file" accept="application/json,.json" id="import" hidden></label>
        <button class="btn ghost" data-act="reset" style="color:#C62828">${ic("trash")}Erase all my data</button></div>
        <p style="margin-top:18px;font-size:13px;color:var(--muted)">Pint Perfect · ${ORDER.length} recipes · works offline once installed.</p>`;
    }
    view.innerHTML = `${navbar(topic[1])}<header class="hdr" style="padding-top:calc(var(--sat) + 60px)"><div class="eyebrow">Guide</div><h1 class="big-title" style="font-size:30px">${esc(topic[1])}</h1></header>
      <div class="g-body">${body}</div>`;
    const imp = $("#import");
    if (imp) imp.addEventListener("change", () => importData(imp.files[0]));
    const sg = $("#sc-g");
    if (sg) { sg.addEventListener("input", sweetConv); sweetConv(); }
  }
  // Sugar grams -> Munkito Monk Sweet + Allulose 1:1 grams (1.0x in lite pints, ~0.78x in full-fat pints).
  function sweetConv() {
    const inp = $("#sc-g"), out = $("#sc-out");
    if (!inp || !out) return;
    const full = !!$('[data-sconv="full"].on'), g = Math.max(0, parseFloat(inp.value) || 0);
    const m = Math.round(g * (full ? 0.78 : 1));
    out.innerHTML = `<div class="sc-res"><b>${m} g</b><span>Munkito Monk Sweet + Allulose 1:1</span></div>
      <p>${full ? "Full-fat and cream-rich pints turn soupy with a 1:1 swap, so use about 78% of the sugar weight. Top up with a few drops of Munkito liquid monk fruit if needed." : "Lite and protein pints swap 1:1 by weight."}
      Keep it to about 60 g per pint so a half-pint serving stays under ~30 g; more can upset the stomach.${m > 60 ? ' <b class="warn">That\'s more than 60 g for one pint.</b>' : ""}</p>`;
  }

  async function exportData() {
    const blob = new Blob([JSON.stringify({ app: "pint-perfect", v: 2, at: new Date().toISOString(), data: S }, null, 1)], { type: "application/json" });
    const name = `pint-perfect-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Pint Perfect backup" }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importData(file) {
    if (!file) return;
    file.text().then((t) => {
      const j = JSON.parse(t);
      if (j.app !== "pint-perfect" || !j.data) throw new Error("bad");
      S = migrate(j.data); save(); updateBadge();
      toast("Backup restored"); route(true);
    }).catch(() => toast("That doesn't look like a Pint Perfect backup"));
  }

  // ------------------------------------------------------------------ toast
  let toastTimer;
  function toast(msg, action, fn) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ""}`;
    t.hidden = false;
    if (action) t.querySelector("button").onclick = () => { t.hidden = true; fn(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, action ? 5000 : 2600);
  }

  // ------------------------------------------------------------------ events
  document.addEventListener("click", (e) => {
    const t = e.target;
    const act = t.closest("[data-act]");
    const slug = (location.hash.match(/^#\/r\/([^?]+)/) || [])[1];
    const r = slug && R[decodeURIComponent(slug)];
    const rv = r && V(r, VID);
    if (act) {
      const a = act.dataset.act;
      if (a === "back") goBack();
      else if (a === "clear-q") { HOME.q = ""; $("#q").value = ""; act.hidden = true; renderResults(); $("#q").focus(); }
      else if (a === "dismiss-install") { S.dismissInstall = true; save(); act.parentElement.remove(); }
      else if (a === "fav" && r) {
        if (S.favs[r.slug]) delete S.favs[r.slug]; else S.favs[r.slug] = Date.now();
        save(); act.classList.toggle("faved", !!S.favs[r.slug]); toast(S.favs[r.slug] ? "Saved" : "Removed from saved");
      } else if (a === "share" && r) {
        const url = location.href.split("#")[0] + recipeHash(r.slug, VID);
        const vt = VID !== "default" ? ` (${VLABEL[VID]} version)` : "";
        if (navigator.share) navigator.share({ title: r.title + vt, text: `${r.title}${vt}: ${r.subtitle}`, url }).catch(() => {});
        else navigator.clipboard?.writeText(url).then(() => toast("Link copied"));
      } else if (a === "clear-ticks" && r) { delete S.ticks[tkey(r.slug, rv._vid)]; save(); renderPanel(r); }
      else if (a === "clear-done" && r) { delete S.done[tkey(r.slug, rv._vid)]; save(); renderPanel(r); }
      else if (a === "tab-method" && r) { setTab("method", r); }
      else if (a === "cook" && r) cookMode(rv);
      else if (a === "freeze" && r) addFreezer(r.slug, rv._vid);
      else if (a === "made" && r) { (S.made[r.slug] = S.made[r.slug] || []).push(Date.now()); save(); renderPanel(r); toast("Logged. Nice pint!"); }
      else if (a === "shoplist" && r) {
        const ticks = new Set(S.ticks[tkey(r.slug, rv._vid)] || []);
        const need = [...ingList(rv).map((x, i) => ["i" + i, x]), ...(rv.mixins || []).map((x, i) => ["m" + i, x])].filter(([k]) => !ticks.has(k));
        const text = `${r.title}${rv._vid !== "default" ? ` (${VLABEL[rv._vid]})` : ""}: shopping list\n` + need.map(([, x]) => `• ${x.item} (${x.qty})`).join("\n");
        if (navigator.share) navigator.share({ title: `${r.title} shopping list`, text }).catch(() => {});
        else navigator.clipboard?.writeText(text).then(() => toast("List copied"));
      } else if (a === "log-pint") pickSheet((s) => { addFreezer(s); renderFreezer(); });
      else if (a === "export") exportData();
      else if (a === "reset") { if (confirm("Erase saved recipes, ratings, notes and freezer log on this phone?")) { S = migrate({}); save(); updateBadge(); toast("All data erased"); route(true); } }
      return;
    }
    const mv = t.closest("[data-myver]");
    if (mv) { if (mv.dataset.myver !== S.myver) setMyver(mv.dataset.myver); return; }
    const vb = t.closest("[data-ver]");
    if (vb && r) { setVersion(r, vb.dataset.ver); return; }
    const gb = t.closest("[data-gum]");
    if (gb && r) { if (gb.dataset.gum === "1") S.gum[r.slug] = true; else delete S.gum[r.slug]; save(); renderPanel(r); return; }
    const sc = t.closest("[data-sconv]");
    if (sc) { $$("[data-sconv]").forEach((b) => b.classList.toggle("on", b === sc)); sweetConv(); return; }
    const f = t.closest("[data-f]"), p = t.closest("[data-p]");
    if (f || p) {
      const set = f ? HOME.f : HOME.p, k = f ? f.dataset.f : p.dataset.p;
      set.has(k) ? set.delete(k) : set.add(k);
      (f || p).classList.toggle("on");
      renderResults();
      return;
    }
    const tb = t.closest("[data-tab-r]");
    if (tb && r) { setTab(tb.dataset.tabR, r); return; }
    const per = t.closest("[data-per]");
    if (per && r) { S.per = per.dataset.per; save(); renderNutri(r); return; }
    const tick = t.closest("[data-tick]");
    if (tick && r) {
      const tk = tkey(r.slug, rv._vid), set = new Set(S.ticks[tk] || []), k = tick.dataset.tick;
      set.has(k) ? set.delete(k) : set.add(k);
      S.ticks[tk] = [...set]; save(); tick.classList.toggle("on");
      const h = tick.closest(".card")?.querySelector(".card-h");
      if (h && !h.querySelector("button") && set.size && h.textContent.includes("Ingredients")) h.insertAdjacentHTML("beforeend", '<button data-act="clear-ticks">Clear ticks</button>');
      return;
    }
    const step = t.closest("[data-step]");
    if (step && r) {
      const dk = tkey(r.slug, rv._vid), set = new Set(S.done[dk] || []), k = +step.dataset.step;
      set.has(k) ? set.delete(k) : set.add(k);
      S.done[dk] = [...set]; save(); renderPanel(r); return;
    }
    const star = t.closest("[data-star]");
    if (star && r) { const n = +star.dataset.star; S.ratings[r.slug] = S.ratings[r.slug] === n ? 0 : n; save(); renderPanel(r); return; }
    const pan = t.closest("[data-pan]");
    if (pan) { const k = pan.dataset.pan; S.pantry[k] = !S.pantry[k]; save(); pan.classList.toggle("on"); return; }
    const spun = t.closest("[data-spun]");
    if (spun) {
      const it = S.freezer.find((x) => x.id === spun.dataset.spun);
      if (it) { (S.made[it.slug] = S.made[it.slug] || []).push(Date.now()); S.freezer = S.freezer.filter((x) => x !== it); save(); updateBadge(); renderFreezer(); toast("Logged as made. Enjoy!"); }
      return;
    }
    const rm = t.closest("[data-rm]");
    if (rm) {
      const it = S.freezer.find((x) => x.id === rm.dataset.rm);
      S.freezer = S.freezer.filter((x) => x !== it); save(); updateBadge(); renderFreezer();
      toast("Removed", "Undo", () => { S.freezer.push(it); save(); updateBadge(); renderFreezer(); });
    }
  });

  function setTab(k, r) {
    TAB = k;
    $$("#rtabs button").forEach((b) => b.classList.toggle("on", b.dataset.tabR === k));
    renderPanel(r);
    const bar = $(".tabs-r");
    const top = bar.getBoundingClientRect().top;
    const stickTop = parseFloat(getComputedStyle(bar).top) || 0;
    if (top < stickTop + 1) window.scrollTo({ top: window.scrollY + top - stickTop, behavior: "instant" });
  }

  // ------------------------------------------------------------------ routing
  const stack = [];
  const scrolls = {};
  let current = null;
  const TOP = ["#/", "#/saved", "#/freezer", "#/guide"];
  function goBack() {
    if (stack.length > 1) history.back();
    else {
      const h = location.hash;
      location.hash = h.startsWith("#/guide/") ? "#/guide" : h.startsWith("#/r/") ? "#/" : "#/";
    }
  }
  function route(keep) {
    const h = location.hash || "#/";
    if (current) scrolls[current] = window.scrollY;
    let back = false;
    if (!keep) {
      if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); back = true; }
      else if (TOP.includes(h)) { stack.length = 0; stack.push(h); }
      else stack.push(h);
    }
    const prevTop = current && TOP.includes(current);
    current = h;
    const [path, qs] = h.slice(2).split("?");
    const parts = path.split("/");
    if (parts[0] === "r") { if (!back && !keep) TAB = "ing"; renderRecipe(decodeURIComponent(parts[1] || ""), new URLSearchParams(qs || "").get("v")); }
    else if (parts[0] === "s") renderSection(+parts[1]);
    else if (parts[0] === "saved") renderSaved();
    else if (parts[0] === "freezer") renderFreezer();
    else if (parts[0] === "guide") renderGuide(parts[1]);
    else renderHome();
    const tab = parts[0] === "saved" ? "saved" : parts[0] === "freezer" ? "freezer" : parts[0] === "guide" ? "guide" : "home";
    $$("#tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
    view.classList.remove("enter", "enter-back", "fade");
    void view.offsetWidth;
    if (!keep) view.classList.add(TOP.includes(h) && (prevTop || !back) ? "fade" : back ? "enter-back" : "enter");
    window.scrollTo(0, back || keep ? scrolls[h] || 0 : 0);
    onScroll();
  }
  window.addEventListener("hashchange", () => route(false));

  // tapping the active tab scrolls to top / pops to root
  $("#tabs").addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  function onScroll() {
    const nb = $("#navbar");
    if (nb) nb.classList.toggle("solid", window.scrollY > 140);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // edge swipe to go back (standalone web apps have no system back gesture)
  let sx = null, sy = null, dragging = false;
  document.addEventListener("touchstart", (e) => {
    if (document.body.classList.contains("cookmode-open") || TOP.includes(location.hash || "#/")) return;
    const t = e.touches[0];
    if (t.clientX < 24) { sx = t.clientX; sy = t.clientY; dragging = false; }
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (sx === null) return;
    const t = e.touches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
    if (!dragging && dy > 20 && dy > dx) { sx = null; return; }
    if (dx > 8) { dragging = true; view.style.transform = `translateX(${Math.max(0, dx)}px)`; view.style.transition = "none"; }
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    view.style.transition = "transform .2s ease";
    if (dragging && dx > 90) { view.style.transform = `translateX(100%)`; setTimeout(() => { view.style.transform = ""; view.style.transition = ""; goBack(); }, 160); }
    else { view.style.transform = ""; setTimeout(() => { view.style.transition = ""; }, 200); }
    dragging = false;
  });

  // ------------------------------------------------------------------ boot
  fetch("data/book.json").then((r) => r.json()).then((book) => {
    BOOK = book;
    const names = Object.keys(book.programs).sort((a, b) => b.length - a.length).concat(["MAX FILL"]);
    PW_RE = new RegExp("(?<![A-Za-z-])(" + names.map((n) => n.replace(/[-]/g, "\\-")).join("|") + ")(?![A-Za-z-])", "g");
    book.sections.forEach((s) => { SECT[s.num] = s; });
    HAS_VARIANTS = book.recipes.some((r) => r.versions && Object.keys(r.versions).length);
    book.recipes.forEach((r) => { R[r.slug] = r; ORDER.push(r.slug); indexRecipe(r); });
    updateBadge();
    setInterval(() => { updateBadge(); if (location.hash === "#/freezer" && !$("#sheet-root").innerHTML) renderFreezer(); }, 30000);
    route(false);
  }).catch(() => { view.innerHTML = '<div class="empty"><h3>Couldn\'t load recipes</h3><p>Open the app once while online to download them.</p></div>'; });

  if ("serviceWorker" in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (had) toast("Recipes updated", "Reload", () => location.reload()); });
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
