/* ==========================================================
   Histo Test — main app shell, hash router, helpers
   ========================================================== */

(function () {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

  const el = (tag, attrs, children) => {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (attrs[k] === undefined || attrs[k] === null) continue;
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (k === "dataset") {
          for (const dk in attrs[k]) e.dataset[dk] = attrs[k][dk];
        } else if (k.startsWith("on") && typeof attrs[k] === "function") {
          e.addEventListener(k.slice(2), attrs[k]);
        } else if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(e.style, attrs[k]);
        } else {
          e.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        if (typeof c === "string") e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  };

  const escapeHTML = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // SYSTEMS metadata, ordered as in the curriculum
  const SYSTEMS = [
    { id: "GIT",      label: "Gastrointestinal" },
    { id: "CVS",      label: "Cardiovascular" },
    { id: "Lymphatic",label: "Lymphatic" },
    { id: "Respiratory", label: "Respiratory" },
    { id: "Urinary",  label: "Urinary" },
    { id: "MaleGenital",   label: "Male genital" },
    { id: "FemaleGenital", label: "Female genital" },
    { id: "Endocrine",label: "Endocrine" },
    { id: "Nervous",  label: "Nervous" },
    { id: "Integument", label: "Integumentary" },
  ];
  const systemLabel = (id) => (SYSTEMS.find(s => s.id === id) || { label: id }).label;

  // Local-storage helpers
  const LS = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // Expose helpers
  window.HT = {
    $, $$, el, escapeHTML, shuffle, SYSTEMS, systemLabel, LS,
  };

  // ---------- Router ----------
  const Routes = {
    home:    renderHome,
    library: () => window.HTLibrary.render(),
    mocks:   () => window.HTMock.renderLanding(),
    mock:    () => window.HTMock.renderRunner(),
    result:  () => window.HTMock.renderResult(),
    about:   renderAbout,
  };

  function parseHash() {
    const h = (location.hash || "#/").replace(/^#\/?/, "");
    const [path, queryStr] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const route = parts[0] || "home";
    const params = parts.slice(1);
    const query = {};
    if (queryStr) queryStr.split("&").forEach(kv => {
      const [k, v] = kv.split("=");
      query[decodeURIComponent(k)] = v == null ? "" : decodeURIComponent(v);
    });
    return { route, params, query };
  }

  function setNavActive(routeName) {
    $$(".topnav a").forEach(a => {
      a.classList.toggle("active",
        a.dataset.route === routeName
        || (routeName === "mock" && a.dataset.route === "mocks")
        || (routeName === "result" && a.dataset.route === "mocks"));
    });
  }

  function navigate() {
    const ctx = parseHash();
    setNavActive(ctx.route);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    const main = $("#app");

    // Fade-out, swap content, fade-in
    main.style.opacity = "0";
    main.style.transform = "translateY(7px)";
    main.style.transition = "none";

    requestAnimationFrame(() => {
      main.innerHTML = "";
      const fn = Routes[ctx.route] || Routes.home;
      fn(ctx);

      requestAnimationFrame(() => {
        main.style.transition = "opacity 0.24s ease, transform 0.24s ease";
        main.style.opacity = "";
        main.style.transform = "";
        setTimeout(() => { main.style.transition = ""; }, 260);
      });
    });

    if (window.HTSounds) window.HTSounds.play("navigate");
  }

  window.addEventListener("hashchange", navigate);
  window.addEventListener("DOMContentLoaded", () => {
    if (!location.hash) location.hash = "#/";
    navigate();

    // Wire sound toggle button
    const soundBtn = $("#sound-toggle");
    if (soundBtn && window.HTSounds) {
      soundBtn.addEventListener("click", () => {
        const on = window.HTSounds.toggle();
        soundBtn.textContent = on ? "🔊" : "🔇";
        soundBtn.classList.toggle("muted", !on);
        if (on) window.HTSounds.play("click");
      });
    }
  });

  // ---------- Home / Welcome page ----------
  function renderHome() {
    const main = $("#app");
    const totalQ = (window.HISTO_QUESTIONS || []).length;
    const totalT = (window.HISTO_TERMS || []).length;
    const sysCount = SYSTEMS.length;

    const hero = el("section", { class: "hero" }, [
      el("div", null, [
        el("h1", { text: "Welcome to Histo Test" }),
        el("p", { class: "lede" },
          "Practice histology and embryology the way it’s really tested. " +
          "Browse the term library or pick one of ten 30-question, 45-minute mock papers — each mock is a different mix of organ systems, " +
          "and every answer comes with an explanation that shows why it’s correct, why each distractor is wrong, and what wording change would flip it."),
        el("div", { class: "btn-row", style: { marginTop: "1.1rem" } }, [
          el("a", { class: "btn big", href: "#/mocks", text: "Choose a mock test" }),
          el("a", { class: "btn outline", href: "#/library", text: "Open the term library" }),
        ]),
        el("div", { class: "badges" }, [
          el("span", { class: "badge", text: `${totalQ} questions` }),
          el("span", { class: "badge", text: `${totalT} terms` }),
          el("span", { class: "badge", text: `${sysCount} organ systems` }),
          el("span", { class: "badge", text: "10 mocks · 30 Q · 45 min" }),
          el("span", { class: "badge", text: "Source-verbatim nomenclature" }),
        ]),
      ]),
    ]);
    main.appendChild(hero);

    const grid = el("div", { class: "cards" });
    grid.appendChild(el("a", { class: "card", href: "#/mocks" }, [
      el("span", { class: "ic", text: "M" }),
      el("h3", { text: "Mock tests" }),
      el("p", { text: "Ten different mock papers to choose from — each 30 questions, 45-minute timer, instant feedback. Multi-select, single-MCQ, fill-in and short-answer styles — exactly as on the printed exams." }),
      el("span", { class: "arrow", text: "Choose a mock →" }),
    ]));
    grid.appendChild(el("a", { class: "card", href: "#/library" }, [
      el("span", { class: "ic", text: "T" }),
      el("h3", { text: "Term library" }),
      el("p", { text: "Search and skim every term used in the lectures, with the same definitions, terminology and Latin nomenclature as in the source slides." }),
      el("span", { class: "arrow", text: "Open library →" }),
    ]));
    grid.appendChild(el("a", { class: "card", href: "#/about" }, [
      el("span", { class: "ic", text: "?" }),
      el("h3", { text: "About this site" }),
      el("p", { text: "What sources were used, how questions and explanations are structured, and how to host the whole folder on GitHub Pages." }),
      el("span", { class: "arrow", text: "Read more →" }),
    ]));
    main.appendChild(grid);

    // Quick "systems covered" chip strip
    const chipStrip = el("div", { class: "system-tags", style: { marginTop: "1.5rem" } });
    SYSTEMS.forEach(s => {
      const chip = el("span", { class: "system-tag" });
      chip.textContent = s.label;
      chipStrip.appendChild(chip);
    });
    main.appendChild(el("p", { class: "muted", style: { marginTop: "1.5rem" }, text: "Topics covered:" }));
    main.appendChild(chipStrip);
  }

  // ---------- About page ----------
  function renderAbout() {
    const main = $("#app");
    main.appendChild(el("h1", { text: "About Histo Test" }));
    const box = el("div", { class: "about-content" });
    box.innerHTML = `
      <h2>What this is</h2>
      <p>Histo Test is a self-contained, browser-only practice platform for the <strong>B83006 Histology &amp; General Embryology</strong> course (Charles University, 1st Faculty of Medicine, Prague). It runs entirely in your browser — no server, no login — and the whole folder can be uploaded as-is to <strong>GitHub Pages</strong> for free public hosting.</p>

      <h2>How the mocks are organised</h2>
      <p>There are <strong>ten fixed mock papers</strong> on the Mock-tests page; you pick whichever one you want to attempt. Each mock contains <strong>30 questions</strong>, runs on a <strong>45-minute timer</strong>, and uses a different mix of organ systems so you can drill specific topics or take a balanced final-style paper.</p>

      <h2>How questions are written</h2>
      <p>Every question follows the <em>style and difficulty</em> of the printed sample exams in the resources: a mix of <strong>multi-select "select the correct statements"</strong> blocks (5 points), <strong>single-best-answer MCQs</strong> (1 point), <strong>fill-in-the-blank</strong> mini-paragraphs (10 points) and <strong>short-answer</strong> identifiers (1 point). The wording deliberately preserves the Czech-English authoring style of the source ("kinocilia", "tubuli seminiferi contorti", "tunica muscularis", "junctional epithelium"…).</p>
      <p>For every option you'll find:</p>
      <ul>
        <li><strong>Why correct</strong> — the histological fact that makes the option right.</li>
        <li><strong>Why wrong</strong> — for each distractor, the specific reason the statement fails.</li>
        <li><strong>How to make it right</strong> — what wording change of the option (or the stem) would flip its truth-value.</li>
      </ul>

      <h2>Sources</h2>
      <p>All terminology, definitions and figure labels are drawn from the lecturers' slide decks (Mária Hovořáková, Zuzana Pavlíková, et al.) and the textbooks they cite: <em>Mescher 2013; Ross &amp; Pawlina 2011 / 2015; Junqueira &amp; Carneiro; Sobotta &amp; Hammerson; Stevens &amp; Lowe; Eroschenko 2013; Krstič 1984; Vacek 1995; Lavický et al. 2021; Nanci, Oral Histology 2008; Sadler 2012; Gartner &amp; Hiatt 1994.</em></p>

      <h2>Technical</h2>
      <ul>
        <li>Static HTML/CSS/JS — no build step, no dependencies.</li>
        <li>Works locally (open <code>index.html</code>) and on GitHub Pages.</li>
        <li>Per-mock results, history and pause/resume are stored in your browser's <code>localStorage</code>; clearing site data resets them.</li>
        <li>Keyboard-friendly: numbers <kbd>1-9</kbd> select options, <kbd>N</kbd>/<kbd>P</kbd> jump between questions, <kbd>Enter</kbd> submits.</li>
      </ul>

      <h2>Licence</h2>
      <p>This site is for educational practice. The slide content used to derive questions and term definitions remains the intellectual property of its respective authors and is cited within each item. The platform code itself is released under the MIT licence — see <code>LICENSE</code>.</p>
    `;
    main.appendChild(box);
  }

})();
