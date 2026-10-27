(function () {
  "use strict";

  const EVENTS = window.MSC_EVENTS || [];
  const PARTNERS = window.MSC_PARTNERS || { hosts: [], sponsors: [] };
  const STATS = window.MSC_STATS || {};
  const CONFIG = window.MSC_CONFIG || {};

  const IMG = (name) => `assets/img/meetups/${name}.jpg`;
  const TYPE_LABEL = { meetup: "Meetup", socrates: "SoCraTes", codesnack: "Code Snack", online: "En ligne" };
  const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel) => document.querySelector(sel);

  // Une date "AAAA-MM" (jour inconnu) s'affiche sans jour.
  function formatDate(iso, withDay = true) {
    const [y, m, d] = iso.split("-").map(Number);
    return (withDay && d ? d + " " : "") + MONTHS[m - 1] + " " + y;
  }

  function place(e) {
    return [e.venue, e.city].filter(Boolean).join(", ");
  }

  function initNav() {
    const toggle = $(".nav-toggle");
    const nav = $("#nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (ev) => {
      if (ev.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function renderStats() {
    const el = $("#stats");
    if (!el) return;
    const items = [
      [STATS.events, "événements depuis " + STATS.since],
      [STATS.hosts, "entreprises hôtes"],
      ["~" + STATS.avgRegistrations, "inscrits par meetup (2025-26)"],
      [STATS.linkedinFollowers.toLocaleString("fr-FR"), "abonnés LinkedIn"],
      [STATS.socratesEditions, "éditions de SoCraTes Maroc"]
    ];
    el.innerHTML = items.map(([n, l]) => `<li><b>${esc(n)}</b><span>${esc(l)}</span></li>`).join("");
  }

  // Lightbox partagée : chaque ouverture reçoit sa propre liste de photos.
  const lightbox = (function () {
    const box = $("#lightbox");
    if (!box) return { open() {} };
    const img = box.querySelector("img");
    const cap = box.querySelector("figcaption");
    let list = [];
    let index = 0;
    let lastFocus = null;

    function show() {
      const item = list[index];
      img.src = IMG(item.photo);
      img.alt = item.caption;
      cap.textContent = item.caption + (list.length > 1 ? `  ·  ${index + 1} / ${list.length}` : "");
      box.querySelector(".lb-prev").hidden = list.length < 2;
      box.querySelector(".lb-next").hidden = list.length < 2;
    }
    function open(items, start) {
      list = items;
      index = start || 0;
      lastFocus = document.activeElement;
      show();
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      box.querySelector(".lb-close").focus();
    }
    function close() {
      box.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    const step = (d) => { index = (index + d + list.length) % list.length; show(); };

    box.querySelector(".lb-close").addEventListener("click", close);
    box.querySelector(".lb-prev").addEventListener("click", () => step(-1));
    box.querySelector(".lb-next").addEventListener("click", () => step(1));
    box.addEventListener("click", (ev) => { if (ev.target === box) close(); });
    document.addEventListener("keydown", (ev) => {
      if (!box.classList.contains("open")) return;
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") step(-1);
      if (ev.key === "ArrowRight") step(1);
    });
    return { open };
  })();

  function photoItems(e) {
    return (e.photos || []).map((p) => ({ photo: p, caption: `${e.title} · ${formatDate(e.date)}` }));
  }

  function linksHtml(e) {
    const l = e.links || {};
    const out = [];
    if (l.linkedin) out.push(`<a href="${esc(l.linkedin)}" target="_blank" rel="noopener">Récap LinkedIn</a>`);
    if (l.luma) out.push(`<a href="${esc(l.luma)}" target="_blank" rel="noopener">Page Luma</a>`);
    if (l.site) out.push(`<a href="${esc(l.site)}" target="_blank" rel="noopener">Site SoCraTes</a>`);
    return out.join("");
  }

  function tagsHtml(topics, max) {
    if (!topics || !topics.length) return "";
    return `<ul class="tags">${topics.slice(0, max).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  function renderFeatured() {
    const el = $("#featured");
    if (!el) return;
    const featured = EVENTS.filter((e) => e.type === "meetup" && e.photos && e.photos.length).slice(0, 3);
    el.innerHTML = featured.map((e) => {
      const stats = e.registrations ? ` · ${e.registrations} inscrits` : "";
      return `
        <article class="feature-card reveal">
          <button class="thumb" type="button" data-event="${esc(e.id)}" aria-label="Voir les ${e.photos.length} photos de ${esc(e.title)}">
            <img src="${IMG(e.photos[0])}" alt="" loading="lazy">
            <span class="count">${e.photos.length} photos</span>
          </button>
          <div class="body">
            <p class="meta">${formatDate(e.date)} · ${esc(e.city)}${stats}</p>
            <h3>${esc(e.title)}</h3>
            ${e.summary ? `<p>${esc(e.summary)}</p>` : ""}
            ${tagsHtml(e.topics, 4)}
            <div class="links">${linksHtml(e)}</div>
          </div>
        </article>`;
    }).join("");
    el.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-event]");
      if (!btn) return;
      const e = EVENTS.find((x) => x.id === btn.dataset.event);
      lightbox.open(photoItems(e), 0);
    });
  }

  function renderTimeline(filter) {
    const el = $("#timeline");
    if (!el) return;
    const list = EVENTS.filter((e) => filter === "all" || e.type === filter);
    const byYear = new Map();
    list.forEach((e) => {
      const y = e.date.slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(e);
    });
    el.innerHTML = [...byYear.entries()].map(([year, items]) => `
      <section class="year-group">
        <h3>${year}</h3>
        <ol>
          ${items.map((e) => {
            const extra = [];
            if (e.registrations) extra.push(`${e.registrations} inscrits`);
            if (e.participants) extra.push(`${e.participants} participants`);
            if (e.sponsors) extra.push(`${e.sponsors.length} partenaires`);
            return `
            <li class="tl-item">
              <time datetime="${esc(e.date)}">${formatDate(e.date, false)}</time>
              <div>
                <h4>${esc(e.title)}</h4>
                <div class="where">${esc(place(e))}${extra.length ? " · " + esc(extra.join(" · ")) : ""}</div>
                ${tagsHtml(e.topics, 6)}
              </div>
              <span class="badge ${esc(e.type)}">${TYPE_LABEL[e.type] || e.type}</span>
            </li>`;
          }).join("")}
        </ol>
      </section>`).join("");
  }

  function initFilters() {
    const chips = document.querySelectorAll(".filters .chip");
    chips.forEach((chip) => chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      renderTimeline(chip.dataset.filter);
    }));
    renderTimeline("all");
  }

  function renderGallery() {
    const el = $("#gallery");
    if (!el) return;
    const items = EVENTS.flatMap(photoItems);
    el.innerHTML = items.map((it, i) => `
      <button type="button" data-i="${i}" aria-label="Agrandir : ${esc(it.caption)}">
        <img src="${IMG(it.photo)}" alt="${esc(it.caption)}" loading="lazy">
        <span class="cap">${esc(it.caption)}</span>
      </button>`).join("");
    el.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-i]");
      if (btn) lightbox.open(items, Number(btn.dataset.i));
    });
  }

  function renderPartners() {
    const fill = (sel, names) => {
      const el = $(sel);
      if (el) el.innerHTML = names.map((n) => `<li>${esc(n)}</li>`).join("");
    };
    fill("#hosts", PARTNERS.hosts);
    fill("#sponsors", PARTNERS.sponsors);
  }

  function renderOffers() {
    const el = $("#offers");
    if (!el || !CONFIG.offers) return;
    el.innerHTML = CONFIG.offers.map((o) => `
      <article class="offer${o.highlight ? " highlight" : ""} reveal">
        ${o.highlight ? '<span class="flag">Nouveau</span>' : ""}
        <h3>${esc(o.name)}</h3>
        <div class="price">${esc(o.price || "Sur devis")}</div>
        <p class="tagline">${esc(o.tagline)}</p>
        <h4>Vous apportez</h4>
        <ul class="give">${o.youProvide.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>Nous apportons</h4>
        <ul>${o.weProvide.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <a class="btn ${o.highlight ? "btn-green" : "btn-ghost"}" href="accueillir.html?formule=${encodeURIComponent(o.id)}">Choisir cette formule</a>
      </article>`).join("");
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    els.forEach((e) => io.observe(e));
  }

  initNav();
  renderStats();
  renderFeatured();
  initFilters();
  renderGallery();
  renderPartners();
  renderOffers();
  initReveal();
})();
