(function () {
  "use strict";

  const CONFIG = window.MSC_CONFIG || {};
  const OFFERS = CONFIG.offers || [];
  const DRAFT_KEY = "msc-host-draft-v1";
  const TOTAL = 4;
  const STEP_TITLES = ["Formule", "L'événement", "Votre entreprise", "Contact"];
  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  const form = document.getElementById("host-form");
  if (!form) return;
  const steps = [...form.querySelectorAll(".step")];
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const alertBox = document.getElementById("form-alert");
  const bars = [...form.querySelectorAll(".progress span")];
  const progressLabel = document.getElementById("progress-label");
  let current = 1;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Le stockage local peut être indisponible (navigation privée) : le formulaire fonctionne sans.
  const storage = {
    get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch (e) { /* brouillon non conservé */ } },
    clear() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* rien à nettoyer */ } }
  };

  function renderOffers() {
    const wrap = document.getElementById("offer-choices");
    wrap.innerHTML = OFFERS.map((o) => `
      <label class="choice-card">
        <input type="radio" name="formule" value="${esc(o.id)}" required>
        <span class="dot"></span>
        <span><strong>${esc(o.name)}</strong><small>${esc(o.tagline)}</small></span>
        <span class="price">${esc(o.price || "Sur devis")}</span>
      </label>`).join("");
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function setupDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    form.date.min = isoDate(tomorrow);
    form.date_alt.min = isoDate(tomorrow);
    form.date.addEventListener("change", updateDateHelp);
    form.addEventListener("change", (ev) => { if (ev.target.name === "formule") updateDateHelp(); });
  }

  function updateDateHelp() {
    const help = document.getElementById("date-help");
    const v = form.date.value;
    if (!v) { help.textContent = ""; return; }
    const day = new Date(v + "T12:00:00").getDay();
    const formule = form.formule.value;
    if (day !== 6 && formule !== "prive") {
      help.textContent = `C'est un ${DAYS[day]}. Les meetups ouverts ont lieu le samedi matin ; on en discutera ensemble.`;
    } else {
      help.textContent = `${DAYS[day].charAt(0).toUpperCase() + DAYS[day].slice(1)}, c'est noté.`;
    }
  }

  function normalizePhone(v) {
    return v.replace(/[\s.\-()]/g, "");
  }

  // Formats acceptés : 06/07/05 XXXXXXXX (Maroc) ou international +XXX / 00XXX.
  function validPhone(v) {
    const p = normalizePhone(v);
    return /^0[5-7]\d{8}$/.test(p) || /^(\+|00)\d{8,15}$/.test(p);
  }

  function fieldOf(el) {
    return el.closest(".field");
  }

  function setInvalid(field, invalid) {
    if (!field) return;
    field.classList.toggle("invalid", invalid);
    field.querySelectorAll("input, select, textarea").forEach((i) => i.setAttribute("aria-invalid", String(invalid)));
  }

  function validateStep(n) {
    const step = steps[n - 1];
    let firstBad = null;
    const fail = (field, focusEl) => {
      setInvalid(field, true);
      if (!firstBad) firstBad = focusEl;
    };
    step.querySelectorAll(".field").forEach((f) => setInvalid(f, false));

    if (n === 1) {
      if (!form.formule.value) fail(step.querySelector('[data-name="formule"]'), step.querySelector('input[name="formule"]'));
    }
    if (n === 2) {
      if (!form.date.value || form.date.value < form.date.min) fail(fieldOf(form.date), form.date);
      if (!form.participants.value) fail(fieldOf(form.querySelector('input[name="participants"]')), form.querySelector('input[name="participants"]'));
      const cap = form.capacite.value;
      if (cap && (Number(cap) < 10 || Number(cap) > 1000)) fail(fieldOf(form.capacite), form.capacite);
    }
    if (n === 3) {
      if (!form.entreprise.value.trim()) fail(fieldOf(form.entreprise), form.entreprise);
      const site = form.site.value.trim();
      if (site && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(site)) fail(fieldOf(form.site), form.site);
    }
    if (n === 4) {
      if (!form.nom.value.trim()) fail(fieldOf(form.nom), form.nom);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value.trim())) fail(fieldOf(form.email), form.email);
      if (!validPhone(form.telephone.value)) fail(fieldOf(form.telephone), form.telephone);
      if (!form.consent.checked) fail(fieldOf(form.consent), form.consent);
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function collect() {
    const offer = OFFERS.find((o) => o.id === form.formule.value);
    return {
      formule: offer ? offer.name : form.formule.value,
      date: form.date.value,
      date_alt: form.date_alt.value,
      participants: form.participants.value,
      ville: form.ville.value,
      capacite: form.capacite.value,
      equipements: [...form.querySelectorAll('input[name="equipements"]:checked')].map((i) => i.value),
      sujets: form.sujets.value.trim(),
      entreprise: form.entreprise.value.trim(),
      secteur: form.secteur.value,
      taille: form.taille.value,
      site: form.site.value.trim(),
      adresse: form.adresse.value.trim(),
      nom: form.nom.value.trim(),
      fonction: form.fonction.value.trim(),
      email: form.email.value.trim(),
      telephone: normalizePhone(form.telephone.value),
      preference: form.preference.value,
      message: form.message.value.trim()
    };
  }

  function formatDay(iso) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function renderRecap() {
    const d = collect();
    const rows = [
      ["Formule", d.formule],
      ["Date souhaitée", formatDay(d.date) + (d.date_alt ? ` (ou ${formatDay(d.date_alt)})` : "")],
      ["Crafters attendus", d.participants + (d.capacite ? ` · salle de ${d.capacite} places` : "")],
      ["Lieu", [d.adresse, d.ville].filter(Boolean).join(", ")],
      ["Sur place", d.equipements.join(", ")],
      ["Entreprise", [d.entreprise, d.secteur, d.taille && "équipe tech : " + d.taille].filter(Boolean).join(" · ")]
    ].filter(([, v]) => v);
    document.getElementById("recap").innerHTML =
      "<dl>" + rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("") + "</dl>";
  }

  function show(n) {
    current = n;
    steps.forEach((s, i) => { s.hidden = i !== n - 1; });
    bars.forEach((b, i) => b.classList.toggle("done", i < n));
    progressLabel.textContent = `Étape ${n} sur ${TOTAL} · ${STEP_TITLES[n - 1]}`;
    prevBtn.style.visibility = n === 1 ? "hidden" : "visible";
    nextBtn.textContent = n === TOTAL ? "Envoyer ma demande" : "Continuer";
    if (n === TOTAL) renderRecap();
    hideAlert();
  }

  function focusStep() {
    const legend = steps[current - 1].querySelector("legend");
    legend.setAttribute("tabindex", "-1");
    legend.focus({ preventScroll: true });
    document.getElementById("funnel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showAlert(html) {
    alertBox.innerHTML = html;
    alertBox.classList.add("show");
  }

  function hideAlert() {
    alertBox.classList.remove("show");
  }

  // Brouillon : tout sauf le consentement et le pot de miel.
  function saveDraft() {
    const data = {};
    new FormData(form).forEach((v, k) => {
      if (k === "consent" || k === "website_hp") return;
      if (k === "equipements") (data[k] = data[k] || []).push(v);
      else data[k] = v;
    });
    data._step = current;
    storage.set(data);
  }

  function restoreDraft() {
    const params = new URLSearchParams(location.search);
    const draft = storage.get() || {};
    if (params.get("formule")) draft.formule = params.get("formule");
    Object.entries(draft).forEach(([k, v]) => {
      if (k.startsWith("_")) return;
      const els = form.querySelectorAll(`[name="${CSS.escape(k)}"]`);
      els.forEach((el) => {
        if (el.type === "radio") el.checked = el.value === v;
        else if (el.type === "checkbox") el.checked = Array.isArray(v) && v.includes(el.value);
        else el.value = v;
      });
    });
    if (form.date.value && form.date.value < form.date.min) form.date.value = "";
    if (form.date_alt.value && form.date_alt.value < form.date_alt.min) form.date_alt.value = "";
    updateDateHelp();
    // Arrivée depuis une carte d'offre : la formule est déjà choisie, on passe à l'étape 2.
    if (params.get("formule") && form.formule.value && !draft._step) return 2;
    return Math.min(Math.max(Number(draft._step) || 1, 1), TOTAL);
  }

  function tracking() {
    const params = new URLSearchParams(location.search);
    const t = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((k) => { if (params.get(k)) t[k] = params.get(k); });
    if (document.referrer) t.referrer = document.referrer;
    return t;
  }

  function emailBody(d) {
    return [
      `Formule : ${d.formule}`,
      `Date souhaitée : ${formatDay(d.date)}`,
      d.date_alt ? `Date alternative : ${formatDay(d.date_alt)}` : "",
      `Crafters attendus : ${d.participants}`,
      d.capacite ? `Capacité de la salle : ${d.capacite}` : "",
      `Ville : ${d.ville}${d.adresse ? " (" + d.adresse + ")" : ""}`,
      d.equipements.length ? `Sur place : ${d.equipements.join(", ")}` : "",
      d.sujets ? `Sujets : ${d.sujets}` : "",
      "",
      `Entreprise : ${d.entreprise}`,
      d.secteur ? `Secteur : ${d.secteur}` : "",
      d.taille ? `Équipe tech : ${d.taille}` : "",
      d.site ? `Site : ${d.site}` : "",
      "",
      `Contact : ${d.nom}${d.fonction ? ", " + d.fonction : ""}`,
      `E-mail : ${d.email}`,
      `Téléphone : ${d.telephone}`,
      `Préférence : ${d.preference}`,
      d.message ? `\n${d.message}` : ""
    ].filter((l) => l !== "").join("\n");
  }

  async function submit() {
    if (form.website_hp.value) { done(); return; } // robot : on ne transmet rien

    const d = collect();
    const subject = `Demande d'hébergement meetup · ${d.entreprise} · ${d.date}`;
    const endpoint = (CONFIG.form && CONFIG.form.endpoint) || "";

    if (endpoint) {
      nextBtn.disabled = true;
      nextBtn.textContent = "Envoi…";
      const payload = Object.assign({}, CONFIG.form.extraFields || {}, d, {
        equipements: d.equipements.join(", "),
        _subject: subject,
        subject: subject,
        _replyto: d.email,
        source: location.href.split("?")[0],
        envoye_le: new Date().toISOString()
      }, tracking());
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        done();
      } catch (err) {
        console.error("[MSC] Envoi du formulaire impossible :", err);
        const fallback = CONFIG.contactEmail
          ? ` Vous pouvez aussi nous écrire à <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a>.`
          : ` Vous pouvez aussi nous écrire sur <a href="${esc(CONFIG.linkedinUrl)}" target="_blank" rel="noopener">LinkedIn</a>.`;
        showAlert("L'envoi n'a pas abouti. Vos réponses sont conservées, réessayez dans un instant." + fallback);
        nextBtn.disabled = false;
        nextBtn.textContent = "Envoyer ma demande";
      }
      return;
    }

    if (CONFIG.contactEmail) {
      const href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody(d))}`;
      window.location.href = href;
      done("Votre messagerie s'est ouverte avec la demande pré-remplie : il ne reste qu'à l'envoyer. Nous revenons vers vous sous 48 heures.");
      return;
    }

    console.error("[MSC] Aucun endpoint ni e-mail de contact configuré dans assets/js/config.js");
    showAlert(`Le formulaire n'est pas encore relié à notre boîte de réception. Contactez-nous sur <a href="${esc(CONFIG.linkedinUrl)}" target="_blank" rel="noopener">LinkedIn</a> en attendant.`);
  }

  function done(text) {
    storage.clear();
    form.hidden = true;
    const success = document.getElementById("success");
    if (text) document.getElementById("success-text").textContent = text;
    success.hidden = false;
    success.focus();
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(current)) return;
    if (current < TOTAL) {
      show(current + 1);
      saveDraft();
      focusStep();
    } else {
      submit();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 1) {
      show(current - 1);
      saveDraft();
      focusStep();
    }
  });

  // Entrée dans un champ = « Continuer », pas un envoi natif du formulaire.
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    nextBtn.click();
  });

  form.addEventListener("input", (ev) => {
    const f = fieldOf(ev.target);
    if (f && f.classList.contains("invalid")) setInvalid(f, false);
    saveDraft();
  });
  form.addEventListener("change", (ev) => {
    if (ev.target.name === "formule") setInvalid(steps[0].querySelector('[data-name="formule"]'), false);
    if (ev.target.name === "participants") setInvalid(fieldOf(ev.target), false);
    saveDraft();
  });

  renderOffers();
  setupDates();
  show(restoreDraft());
})();
