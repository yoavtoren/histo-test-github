/* ==========================================================
   Histo Test — Mock test runner (10 pre-built mocks)
   Lifecycle:
     #/mocks       → landing — pick one of 10 mocks
     #/mock        → in-progress test (timer running)
     #/result      → submitted / scored view
   ========================================================== */
(function () {
  "use strict";
  const { $, el, escapeHTML, shuffle, SYSTEMS, systemLabel, LS } = window.HT;

  // ----------------------------------------------------------------
  // Constants
  const QUESTIONS_PER_MOCK = 30;
  const TIMER_MINUTES = 45;
  const PASS_PCT = 60;
  const HIGH_PCT = 70;

  const STORAGE_KEY = "histo-test:current-mock";
  const HISTORY_KEY = "histo-test:history";

  // ----------------------------------------------------------------
  // Pre-built mocks. Each mock is deterministic: opening Mock N always
  // picks the same 30 questions (seeded selection), so it behaves like
  // a stable practice paper. Restarting it does not change the question
  // set unless the underlying question bank itself changes.
  const MOCK_TESTS = [
    {
      id: "mock-01",
      title: "Mock 01 — General comprehensive",
      blurb: "A balanced cross-section of every organ system, just like the printed final exam.",
      seed: 1031,
      mix: { GIT:4, CVS:3, Lymphatic:3, Respiratory:3, Urinary:3, MaleGenital:3, FemaleGenital:3, Endocrine:3, Nervous:3, Integument:2 },
    },
    {
      id: "mock-02",
      title: "Mock 02 — Gastrointestinal heavy",
      blurb: "Salivary glands, oesophagus, stomach, small & large intestine, liver, pancreas — with smaller cameos from the rest.",
      seed: 2087,
      mix: { GIT:10, CVS:2, Lymphatic:2, Respiratory:2, Urinary:3, MaleGenital:2, FemaleGenital:3, Endocrine:2, Nervous:2, Integument:2 },
    },
    {
      id: "mock-03",
      title: "Mock 03 — Cardiovascular & lymphatic",
      blurb: "Heart, vessels, conducting system, lymph node, spleen, thymus — for circulation and immunity weeks.",
      seed: 3109,
      mix: { GIT:3, CVS:6, Lymphatic:6, Respiratory:3, Urinary:2, MaleGenital:2, FemaleGenital:2, Endocrine:2, Nervous:2, Integument:2 },
    },
    {
      id: "mock-04",
      title: "Mock 04 — Respiratory & urinary",
      blurb: "Trachea, bronchioles, alveoli, glomerulus, nephron tubules, urothelium — gas exchange + filtration focus.",
      seed: 4153,
      mix: { GIT:3, CVS:2, Lymphatic:2, Respiratory:6, Urinary:7, MaleGenital:2, FemaleGenital:2, Endocrine:2, Nervous:2, Integument:2 },
    },
    {
      id: "mock-05",
      title: "Mock 05 — Reproductive systems",
      blurb: "Tubuli seminiferi, Sertoli/Leydig, ovary follicles, endometrium, placenta — male + female genital weeks.",
      seed: 5197,
      mix: { GIT:3, CVS:2, Lymphatic:2, Respiratory:2, Urinary:2, MaleGenital:6, FemaleGenital:7, Endocrine:2, Nervous:2, Integument:2 },
    },
    {
      id: "mock-06",
      title: "Mock 06 — Endocrine & nervous",
      blurb: "Pituitary, thyroid, adrenal, pancreatic islets, cerebellum, cortex layers, peripheral nerve — control systems.",
      seed: 6211,
      mix: { GIT:3, CVS:2, Lymphatic:2, Respiratory:2, Urinary:2, MaleGenital:2, FemaleGenital:2, Endocrine:6, Nervous:7, Integument:2 },
    },
    {
      id: "mock-07",
      title: "Mock 07 — Skin & vessels",
      blurb: "Epidermis layers, hair follicle, glands, dermis, mechanoreceptors plus a strong cardiovascular block.",
      seed: 7253,
      mix: { GIT:2, CVS:6, Lymphatic:3, Respiratory:2, Urinary:2, MaleGenital:2, FemaleGenital:2, Endocrine:2, Nervous:2, Integument:7 },
    },
    {
      id: "mock-08",
      title: "Mock 08 — Mixed challenge A",
      blurb: "A different shuffle of all 10 systems with a slight gut tilt — useful as a second cross-system pass.",
      seed: 8311,
      mix: { GIT:5, CVS:2, Lymphatic:3, Respiratory:3, Urinary:3, MaleGenital:3, FemaleGenital:3, Endocrine:3, Nervous:3, Integument:2 },
    },
    {
      id: "mock-09",
      title: "Mock 09 — Mixed challenge B",
      blurb: "Yet another whole-curriculum shuffle, tilted toward the nervous system and integument.",
      seed: 9377,
      mix: { GIT:3, CVS:3, Lymphatic:2, Respiratory:3, Urinary:3, MaleGenital:3, FemaleGenital:3, Endocrine:3, Nervous:4, Integument:3 },
    },
    {
      id: "mock-10",
      title: "Mock 10 — Final exam simulation",
      blurb: "A fresh balanced draw, designed to be saved for the night before the exam.",
      seed: 10433,
      mix: { GIT:4, CVS:3, Lymphatic:3, Respiratory:3, Urinary:3, MaleGenital:3, FemaleGenital:3, Endocrine:3, Nervous:3, Integument:2 },
    },
  ];

  // ----------------------------------------------------------------
  // Mock metadata: emoji, difficulty (1–5)
  const MOCK_EMOJI  = ["🔬","🍽️","❤️","🫁","🧬","🧠","🩺","⚗️","🎯","📋"];
  const MOCK_DIFF   = [2, 3, 2, 2, 4, 4, 2, 3, 3, 4];
  const DIFF_LABELS = ["", "Easy", "Moderate", "Challenging", "Hard", "Expert"];

  // SVG donut pie chart for system mix distribution
  function makePieSVG(mix, colors, size) {
    const total = Object.values(mix).reduce((a, b) => a + b, 0);
    const cx = size / 2, cy = size / 2;
    const R = size * 0.42, r = size * 0.24;
    let angle = -Math.PI / 2;
    let paths = "";
    const GAP = 0.025; // radians gap between segments

    const entries = Object.entries(mix).filter(([, n]) => n > 0);
    entries.forEach(([sysId, count]) => {
      const slice = (count / total) * Math.PI * 2;
      const a1 = angle + GAP / 2;
      const a2 = angle + slice - GAP / 2;
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      const x3 = cx + r * Math.cos(a2), y3 = cy + r * Math.sin(a2);
      const x4 = cx + r * Math.cos(a1), y4 = cy + r * Math.sin(a1);
      const large = slice > Math.PI ? 1 : 0;
      const color = colors[sysId] || "#ccc";
      paths += `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r},${r} 0 ${large},0 ${x4.toFixed(2)},${y4.toFixed(2)} Z" fill="${color}" opacity="0.9"/>`;
      angle += slice;
    });

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${paths}</svg>`;
  }

  // ----------------------------------------------------------------
  // Seeded PRNG (mulberry32) — deterministic per mock.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Build the question list for a given mock — deterministic by seed.
  function buildMockQuestions(mock) {
    const all = window.HISTO_QUESTIONS || [];
    const rng = mulberry32(mock.seed);

    // Group by system
    const bySys = {};
    all.forEach(q => { (bySys[q.system] = bySys[q.system] || []).push(q); });

    // For each system, take the requested count from a seeded shuffle of that system's pool
    const picked = [];
    Object.keys(mock.mix).forEach(sysId => {
      const pool = bySys[sysId] || [];
      const want = Math.min(mock.mix[sysId], pool.length);
      const rngSys = mulberry32(mock.seed * 1009 + sysId.charCodeAt(0));
      const shuffled = seededShuffle(pool, rngSys);
      for (let i = 0; i < want; i++) picked.push(shuffled[i]);
    });

    // If the mix asked for more than the pool can give in some system, fill from leftovers
    if (picked.length < QUESTIONS_PER_MOCK) {
      const remaining = all.filter(q => !picked.includes(q));
      const filler = seededShuffle(remaining, rng);
      while (picked.length < QUESTIONS_PER_MOCK && filler.length) picked.push(filler.shift());
    }

    // Final seeded shuffle so subjects feel randomly mixed across the test
    const ordered = seededShuffle(picked.slice(0, QUESTIONS_PER_MOCK), rng);

    // Shuffle option order per question (also seeded per question, so re-opening is stable)
    return ordered.map((q, qi) => {
      const optRng = mulberry32(mock.seed * 7919 + qi * 13 + 7);
      const opts = (q.options || []).map((o, i) => Object.assign({}, o, { _orig: i }));
      const shuffled = seededShuffle(opts, optRng).map((o, i) => Object.assign({}, o, { letter: String.fromCharCode("A".charCodeAt(0) + i) }));
      return Object.assign({}, q, { options: shuffled });
    });
  }

  // ----------------------------------------------------------------
  // Landing page — horizontal scroll carousel with pie charts
  function renderLanding() {
    const main = $("#app");
    const SYS_COLORS = window.HT.SYS_COLORS || {};

    main.appendChild(el("div", { class: "section-title" }, [
      el("h1", { text: "Mock Tests" }),
      el("small", { text: `${MOCK_TESTS.length} papers · ${QUESTIONS_PER_MOCK} Q · ${TIMER_MINUTES} min · pass ${PASS_PCT}%` }),
    ]));

    // In-progress banner
    const cur = LS.get(STORAGE_KEY, null);
    if (cur && !cur.submitted) {
      const remain = computeRemaining(cur);
      const banner = el("div", { class: "mock-config" });
      const shortTitle = cur.mockTitle ? cur.mockTitle.replace(/^Mock \d+ — /, "") : "a mock";
      banner.appendChild(el("h2", { text: `▶ ${shortTitle} in progress` }));
      banner.appendChild(el("p", { class: "muted", text: `${formatRemaining(remain)} left · started ${formatDate(cur.startedAt)}` }));
      const row = el("div", { class: "btn-row" });
      row.appendChild(el("a", { class: "btn", href: "#/mock", text: "Resume →" }));
      row.appendChild(el("button", {
        class: "btn outline", text: "Discard",
        onclick: () => {
          if (confirm("Discard the current mock?")) {
            LS.set(STORAGE_KEY, null);
            main.innerHTML = "";
            renderLanding();
          }
        },
      }));
      banner.appendChild(row);
      main.appendChild(banner);
    }

    // Best scores keyed by mockId
    const hist = LS.get(HISTORY_KEY, []);
    const bestByMock = {};
    hist.forEach(h => {
      if (!h.mockId) return;
      const prev = bestByMock[h.mockId];
      if (!prev || h.pct > prev.pct) bestByMock[h.mockId] = h;
    });

    // Horizontal scroll carousel
    const scrollWrap = el("div", { class: "mock-scroll-wrap" });
    const scroll = el("div", { class: "mock-scroll" });

    MOCK_TESTS.forEach((m, i) => {
      const emoji     = MOCK_EMOJI[i]  || "🔬";
      const diffLevel = MOCK_DIFF[i]   || 2;
      const diffLabel = DIFF_LABELS[diffLevel] || "";
      const best      = bestByMock[m.id];

      const card = el("article", { class: "mock-card" });
      card.style.animationDelay = `${i * 0.04}s`;

      // Top row: emoji | mock number
      const top = el("div", { class: "mock-card-top" });
      top.appendChild(el("span", { class: "mock-card-emoji", text: emoji }));
      top.appendChild(el("span", { class: "mock-num", text: `Mock ${String(i + 1).padStart(2, "0")}` }));
      card.appendChild(top);

      // Difficulty dots
      const diff = el("div", { class: "mock-diff", dataset: { level: String(diffLevel) } });
      for (let d = 1; d <= 5; d++) {
        diff.appendChild(el("span", { class: "mock-diff-dot" + (d <= diffLevel ? " on" : "") }));
      }
      diff.appendChild(el("span", { class: "mock-diff-label", text: diffLabel }));
      card.appendChild(diff);

      // Title (drop the "Mock NN — " prefix)
      const shortTitle = m.title.includes("—") ? m.title.split("—")[1].trim() : m.title;
      card.appendChild(el("h3", { text: shortTitle }));

      // SVG donut pie chart
      const pieWrap = el("div", { class: "mock-pie" });
      pieWrap.innerHTML = makePieSVG(m.mix, SYS_COLORS, 130);
      pieWrap.appendChild(el("span", { class: "mock-pie-label", text: String(i + 1).padStart(2, "0") }));
      card.appendChild(pieWrap);

      // System mix chips
      const chips = el("div", { class: "mock-mix" });
      Object.entries(m.mix).forEach(([sysId, n]) => {
        if (!n) return;
        const chip = el("span", { class: "mix-chip", dataset: { sys: sysId } });
        chip.appendChild(el("span", { class: "chip-dot" }));
        chip.appendChild(document.createTextNode(systemLabel(sysId)));
        chip.appendChild(el("b", { text: ` ×${n}` }));
        chips.appendChild(chip);
      });
      card.appendChild(chips);

      // Best score line
      const bestP = el("p", { class: "mock-best" + (best ? "" : " none") });
      if (best) {
        bestP.innerHTML = `Best: <b>${best.pct}%</b> · ${best.score}/${best.outOf} pts`;
      } else {
        bestP.textContent = "Not attempted yet";
      }
      card.appendChild(bestP);

      // Action button
      const actions = el("div", { class: "mock-actions" });
      actions.appendChild(el("button", {
        class: "btn",
        text: best ? "Re-attempt →" : "Start →",
        onclick: () => beginMock(m.id),
      }));
      card.appendChild(actions);

      scroll.appendChild(card);
    });

    scrollWrap.appendChild(scroll);
    main.appendChild(scrollWrap);

    // History (compact)
    if (hist.length) {
      const histBox = el("div", { class: "mock-config" });
      histBox.appendChild(el("h2", { text: "Previous attempts" }));
      const ul = el("ul", { class: "history-list" });
      hist.slice().reverse().slice(0, 10).forEach(h => {
        const li = el("li");
        const titleStr = h.mockTitle ? h.mockTitle.replace(/^Mock \d+ — /, "") : (h.mockId || "Mock");
        li.appendChild(el("span", { text: `${formatDate(h.finishedAt)} · ${titleStr}` }));
        const right = el("span", { style: { display: "flex", alignItems: "center", gap: "0.4rem" } });
        right.appendChild(el("span", { text: `${h.score}/${h.outOf} pts` }));
        right.appendChild(gradeChip(h.pct));
        li.appendChild(right);
        ul.appendChild(li);
      });
      histBox.appendChild(ul);
      histBox.appendChild(el("button", {
        class: "btn ghost", text: "Clear history",
        onclick: () => {
          if (confirm("Clear all mock history?")) {
            LS.set(HISTORY_KEY, []);
            main.innerHTML = "";
            renderLanding();
          }
        },
      }));
      main.appendChild(histBox);
    }

    renderLanding.refresh = renderLanding;
  }

  // ----------------------------------------------------------------
  // Begin a mock by id — deterministic question set
  function beginMock(mockId) {
    const mock = MOCK_TESTS.find(m => m.id === mockId);
    if (!mock) { alert("Unknown mock."); return; }
    if (window.HTSounds) window.HTSounds.play("start");
    const questions = buildMockQuestions(mock);
    if (questions.length < QUESTIONS_PER_MOCK) {
      alert("Not enough questions in the bank to build this mock yet.");
      return;
    }

    const state = {
      mockId: mock.id,
      mockTitle: mock.title,
      questions,
      answers: {},          // qid -> {selected: [letterA,letterB], blanks: [string,...]}
      flagged: {},
      currentIndex: 0,
      startedAt: Date.now(),
      durationMs: TIMER_MINUTES * 60 * 1000,
      submitted: false,
    };
    LS.set(STORAGE_KEY, state);
    location.hash = "#/mock";
  }

  // ----------------------------------------------------------------
  // Time helpers
  function computeRemaining(state) {
    const elapsed = Date.now() - state.startedAt;
    return Math.max(0, state.durationMs - elapsed);
  }
  function formatRemaining(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  }
  function formatDate(t) {
    const d = new Date(t);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  // ----------------------------------------------------------------
  // Mock runner
  let timerInterval = null;
  let runState = null;

  function renderRunner() {
    const cur = LS.get(STORAGE_KEY, null);
    if (!cur || !cur.questions) {
      location.hash = "#/mocks"; return;
    }
    if (cur.submitted) {
      location.hash = "#/result"; return;
    }
    runState = cur;

    const main = $("#app");

    if (cur.mockTitle) {
      main.appendChild(el("div", { class: "section-title" }, [
        el("h1", { text: cur.mockTitle }),
        el("small", { text: `${cur.questions.length} questions · ${TIMER_MINUTES}-minute limit` }),
      ]));
    }

    // Top bar with timer
    const bar = el("div", { class: "mock-bar" });
    const left = el("div", { class: "mock-progress" });
    left.appendChild(el("span", { id: "progress-text" }));
    const barBg = el("div", { class: "bar" });
    barBg.appendChild(el("div", { class: "fill", id: "progress-fill" }));
    left.appendChild(barBg);
    bar.appendChild(left);

    const right = el("div", { class: "btn-row" });
    const timer = el("span", { class: "timer", id: "timer" });
    right.appendChild(timer);
    right.appendChild(el("button", { class: "btn outline", id: "btn-prev", text: "Previous", onclick: () => stepBy(-1) }));
    right.appendChild(el("button", { class: "btn outline", id: "btn-next", text: "Next", onclick: () => stepBy(+1) }));
    right.appendChild(el("button", { class: "btn", id: "btn-submit", text: "Submit", onclick: () => trySubmit(false) }));
    bar.appendChild(right);
    main.appendChild(bar);

    // Question container
    main.appendChild(el("div", { id: "q-container" }));

    // Bottom navigation grid (jump to any question)
    const nav = el("div", { class: "mock-config" });
    nav.appendChild(el("h2", { text: "Question map" }));
    const grid = el("div", { class: "system-tags", id: "q-grid" });
    nav.appendChild(grid);
    nav.appendChild(el("p", { class: "muted", style: { marginTop: "0.6rem" }, text: "Click a number to jump. Filled = answered. Outlined = unanswered." }));
    main.appendChild(nav);

    refreshUI();
    startTimer();
    bindKeyboard();
  }

  function bindKeyboard() {
    document.onkeydown = (e) => {
      if (!runState || runState.submitted) return;
      if (e.target.tagName === "INPUT" && e.target.type !== "radio" && e.target.type !== "checkbox") return;
      if (e.key === "n" || e.key === "ArrowRight") { stepBy(+1); }
      else if (e.key === "p" || e.key === "ArrowLeft") { stepBy(-1); }
      else if (/^[1-9]$/.test(e.key)) {
        const idx = +e.key - 1;
        const q = currentQ();
        if (q && q.options[idx]) {
          const lt = q.options[idx].letter;
          toggleSelect(q.id, lt);
        }
      }
    };
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const tick = () => {
      const remaining = computeRemaining(runState);
      const t = $("#timer");
      if (t) {
        t.textContent = "⏱ " + formatRemaining(remaining);
        t.classList.toggle("warn", remaining < 5 * 60 * 1000 && remaining >= 60 * 1000);
        t.classList.toggle("danger", remaining < 60 * 1000);
      }
      if (remaining <= 0) {
        clearInterval(timerInterval);
        trySubmit(true);
      }
    };
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  function currentQ() { return runState.questions[runState.currentIndex]; }

  function stepBy(d) {
    const i = runState.currentIndex + d;
    if (i < 0 || i >= runState.questions.length) return;
    runState.currentIndex = i;
    LS.set(STORAGE_KEY, runState);
    refreshUI();
    if (window.HTSounds) window.HTSounds.play("click");
  }

  function jumpTo(i) {
    runState.currentIndex = i;
    LS.set(STORAGE_KEY, runState);
    refreshUI();
  }

  function refreshUI() {
    const cont = $("#q-container");
    const q = currentQ();
    cont.innerHTML = "";
    cont.appendChild(renderQuestionCard(q, runState, /*reveal*/ false));

    const ans = countAnswered();
    $("#progress-text").textContent = `Q ${runState.currentIndex + 1} of ${runState.questions.length} · ${ans} answered`;
    $("#progress-fill").style.width = (100 * (runState.currentIndex + 1) / runState.questions.length) + "%";
    $("#btn-prev").disabled = runState.currentIndex === 0;
    $("#btn-next").disabled = runState.currentIndex === runState.questions.length - 1;

    refreshGrid();
  }

  function refreshGrid() {
    const grid = $("#q-grid");
    if (!grid) return;
    grid.innerHTML = "";
    runState.questions.forEach((q, i) => {
      const tag = el("button", { class: "system-tag" + (i === runState.currentIndex ? " on" : "") });
      tag.style.minWidth = "2.5rem";
      const ans = runState.answers[q.id];
      const answered = ans && ((ans.selected && ans.selected.length) || (ans.blanks && ans.blanks.some(b => b && b.trim())));
      if (answered) tag.classList.add("on");
      tag.textContent = String(i + 1);
      tag.onclick = () => jumpTo(i);
      grid.appendChild(tag);
    });
  }

  function countAnswered() {
    return runState.questions.filter(q => {
      const a = runState.answers[q.id];
      return a && ((a.selected && a.selected.length) || (a.blanks && a.blanks.some(b => b && b.trim())));
    }).length;
  }

  // ----------------------------------------------------------------
  // Toggle selection (multi-select / single-select / fill)
  function toggleSelect(qid, letter) {
    const q = runState.questions.find(x => x.id === qid);
    const a = runState.answers[qid] || { selected: [], blanks: [] };
    let deselected = false;
    if (q.type === "multi") {
      const idx = a.selected.indexOf(letter);
      if (idx >= 0) { a.selected.splice(idx, 1); deselected = true; }
      else a.selected.push(letter);
    } else {
      deselected = a.selected.length > 0 && a.selected[0] === letter;
      a.selected = deselected ? [] : [letter];
    }
    runState.answers[qid] = a;
    LS.set(STORAGE_KEY, runState);
    refreshUI();
    if (window.HTSounds) window.HTSounds.play(deselected ? "deselect" : "select");
  }

  function setBlank(qid, idx, val) {
    const a = runState.answers[qid] || { selected: [], blanks: [] };
    if (!a.blanks) a.blanks = [];
    a.blanks[idx] = val;
    runState.answers[qid] = a;
    LS.set(STORAGE_KEY, runState);
    refreshGrid();
  }

  // ----------------------------------------------------------------
  // Render a question card (used for runner & for the result review)
  function renderQuestionCard(q, state, reveal) {
    const card = el("article", { class: "q-card" + (reveal ? " revealed" : "") });

    const meta = el("div", { class: "q-meta" });
    meta.appendChild(el("span", { class: "pill", text: `Q ${state.questions.indexOf(q) + 1}` }));
    meta.appendChild(el("span", { class: "pill system", text: systemLabel(q.system), dataset: { sys: q.system } }));
    if (q.subject) meta.appendChild(el("span", { class: "pill", text: q.subject }));
    meta.appendChild(el("span", { class: "pill", text: questionTypeLabel(q.type) + " · " + q.points + " pts" }));
    if (q.source) meta.appendChild(el("span", { class: "pill", text: "Source: " + q.source }));
    card.appendChild(meta);

    // Stem
    const stem = el("div", { class: "q-stem" });
    stem.innerHTML = formatStem(q);
    card.appendChild(stem);

    const ans = state.answers[q.id] || { selected: [], blanks: [] };

    if (q.type === "fill") {
      card.appendChild(renderFill(q, ans, reveal));
    } else {
      card.appendChild(renderOptions(q, ans, reveal));
    }

    if (reveal) card.appendChild(renderExplanationBlock(q, ans));
    return card;
  }

  function questionTypeLabel(t) {
    switch (t) {
      case "multi": return "Select all correct";
      case "single": return "Single best answer";
      case "fill": return "Fill in the blanks";
      case "short": return "Short identifier";
      default: return t;
    }
  }

  function formatStem(q) {
    const stem = escapeHTML(q.stem);
    return stem.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function renderOptions(q, ans, reveal) {
    const ul = el("ul", { class: "q-options" });
    (q.options || []).forEach(opt => {
      const li = el("li", { class: "q-option", role: "button", tabindex: "0" });
      const isSelected = (ans.selected || []).includes(opt.letter);
      li.classList.toggle("selected", !reveal && isSelected);
      li.appendChild(el("span", { class: "letter", text: opt.letter }));
      li.appendChild(el("span", { class: "otext", html: escapeHTML(opt.text).replace(/\n/g, "<br>") }));

      if (!reveal) {
        const handler = () => toggleSelect(q.id, opt.letter);
        li.addEventListener("click", handler);
        li.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handler(); } });
      } else {
        if (opt.correct) {
          if (isSelected) {
            li.classList.add("correct");
            li.appendChild(el("span", { class: "verdict", text: "Correct" }));
          } else {
            li.classList.add("missed");
            li.appendChild(el("span", { class: "verdict", text: "Missed" }));
          }
        } else {
          if (isSelected) {
            li.classList.add("incorrect");
            li.appendChild(el("span", { class: "verdict", text: "Wrong pick" }));
          }
        }
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function renderFill(q, ans, reveal) {
    const wrap = el("div", { class: "fill-row" });
    (q.template || []).forEach(part => {
      if (typeof part === "string") {
        const sp = el("span", { class: "seg" });
        sp.innerHTML = escapeHTML(part).replace(/\n/g, "<br>");
        wrap.appendChild(sp);
      } else if (part && part.blank != null) {
        const idx = part.blank;
        const correctList = (q.blanks || [])[idx] || [];
        const userVal = (ans.blanks || [])[idx] || "";
        if (!reveal) {
          const inp = el("input", {
            class: "fill-blank",
            type: "text",
            "data-idx": idx,
            "aria-label": `Blank ${idx + 1}`,
            placeholder: "…",
            value: userVal,
          });
          inp.style.minWidth = (Math.max(...correctList.map(c => c.length), 6) + 2) + "ch";
          inp.addEventListener("input", e => setBlank(q.id, idx, e.target.value));
          wrap.appendChild(inp);
        } else {
          const isCorrect = matchBlank(userVal, correctList);
          const inp = el("span", { class: "fill-blank " + (isCorrect ? "correct" : "incorrect"), text: userVal || "(blank)" });
          wrap.appendChild(inp);
          if (!isCorrect) {
            wrap.appendChild(el("span", { class: "fill-correction", text: " → " + correctList[0] }));
          }
        }
      }
    });
    return wrap;
  }

  function matchBlank(input, correctList) {
    if (!input) return false;
    const norm = (s) => s.toLowerCase().trim().replace(/[\s\.\,\(\)\-]+/g, " ");
    const got = norm(input);
    return correctList.some(c => norm(c) === got);
  }

  function renderExplanationBlock(q, ans) {
    const box = el("div", { class: "explanation" });
    box.innerHTML = "";

    if (q.summary) {
      const block = el("div", { class: "ex-block" });
      block.innerHTML = `<h4>Why this question</h4><p>${escapeHTML(q.summary)}</p>`;
      box.appendChild(block);
    }

    if (q.type === "fill") {
      const block = el("div", { class: "ex-block" });
      let html = `<h4>Correct answers, blank by blank</h4><ol>`;
      (q.blanks || []).forEach((acc, i) => {
        html += `<li><strong>${escapeHTML(acc[0])}</strong>`;
        if (acc.length > 1) html += ` <span class="muted">(also accepted: ${escapeHTML(acc.slice(1).join(", "))})</span>`;
        if (q.blankNotes && q.blankNotes[i]) html += ` — ${escapeHTML(q.blankNotes[i])}`;
        html += "</li>";
      });
      html += "</ol>";
      block.innerHTML = html;
      box.appendChild(block);
    } else {
      (q.options || []).forEach(opt => {
        const block = el("div", { class: "ex-block " + (opt.correct ? "why-correct" : "why-wrong") });
        let html = "";
        if (opt.correct) {
          html += `<span class="ex-label">Why ${opt.letter} is correct</span> ${escapeHTML(opt.why || "")}`;
        } else {
          html += `<span class="ex-label">Why ${opt.letter} is wrong</span> ${escapeHTML(opt.why || "")}`;
          if (opt.howToMakeRight) {
            html += `<br><span class="ex-label" style="background:var(--warn-bg);color:var(--warn)">Flip it</span> ${escapeHTML(opt.howToMakeRight)}`;
          }
        }
        block.innerHTML = html;
        box.appendChild(block);
      });
      if (q.stemTwist) {
        const block = el("div", { class: "ex-block stem-twist" });
        block.innerHTML = `<span class="ex-label">If the stem changed</span> ${escapeHTML(q.stemTwist)}`;
        box.appendChild(block);
      }
    }
    return box;
  }

  // ----------------------------------------------------------------
  // Submit / score
  function trySubmit(timeUp) {
    const unanswered = runState.questions.length - countAnswered();
    if (!timeUp && unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`)) return;
    }
    if (window.HTSounds) window.HTSounds.play("submit");
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    runState.submitted = true;
    runState.finishedAt = Date.now();
    runState.timedOut = !!timeUp;

    let earned = 0, outOf = 0;
    runState.questions.forEach(q => {
      const ans = runState.answers[q.id] || { selected: [], blanks: [] };
      const { gained, total } = scoreQuestion(q, ans);
      ans.gained = gained; ans.total = total;
      runState.answers[q.id] = ans;
      earned += gained; outOf += total;
    });
    runState.earned = earned;
    runState.outOf = outOf;
    runState.pct = Math.round(100 * earned / Math.max(outOf, 1));

    LS.set(STORAGE_KEY, runState);

    const hist = LS.get(HISTORY_KEY, []);
    hist.push({
      mockId: runState.mockId,
      mockTitle: runState.mockTitle,
      finishedAt: runState.finishedAt,
      score: earned,
      outOf,
      pct: runState.pct,
      questionCount: runState.questions.length,
      timedOut: runState.timedOut,
    });
    if (hist.length > 100) hist.shift();
    LS.set(HISTORY_KEY, hist);

    location.hash = "#/result";
  }

  function scoreQuestion(q, ans) {
    const total = q.points || 1;
    if (q.type === "fill") {
      const blanks = q.blanks || [];
      if (!blanks.length) return { gained: 0, total };
      let correct = 0;
      blanks.forEach((acc, i) => {
        if (matchBlank((ans.blanks || [])[i] || "", acc)) correct++;
      });
      return { gained: Math.round((correct / blanks.length) * total * 100) / 100, total };
    }

    const correctSet = (q.options || []).filter(o => o.correct).map(o => o.letter);
    const sel = ans.selected || [];
    if (q.type === "single" || q.type === "short") {
      if (sel.length === 1 && correctSet.includes(sel[0])) return { gained: total, total };
      return { gained: 0, total };
    }
    if (q.type === "multi") {
      const totalM = q.points || 5;
      const perOption = totalM / Math.max(correctSet.length, 1);
      let raw = 0;
      sel.forEach(l => {
        if (correctSet.includes(l)) raw += perOption;
        else raw -= perOption;
      });
      raw = Math.max(0, raw);
      return { gained: Math.round(raw * 100) / 100, total: totalM };
    }
    return { gained: 0, total };
  }

  // ----------------------------------------------------------------
  // Result view
  function renderResult() {
    const cur = LS.get(STORAGE_KEY, null);
    if (!cur || !cur.submitted) { location.hash = "#/mocks"; return; }
    const main = $("#app");

    const card = el("div", { class: "result-card" });
    const ring = el("div", { class: "score-ring" });
    ring.style.setProperty("--pct", "0");
    const ringText = el("span", { class: "ring-text", text: "0%" });
    ring.appendChild(ringText);
    card.appendChild(ring);
    card.appendChild(el("h2", { text: cur.timedOut ? "Time's up — auto-submitted" : (cur.mockTitle || "Mock") + " · submitted" }));
    card.appendChild(el("p", { html: `You scored <strong>${formatNum(cur.earned)} / ${cur.outOf}</strong> points across ${cur.questions.length} questions.` }));
    card.appendChild(gradeChip(cur.pct));
    const row = el("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "1rem" } });
    row.appendChild(el("a", { class: "btn", href: "#/mocks", text: "Pick another mock", onclick: () => { LS.set(STORAGE_KEY, null); } }));
    row.appendChild(el("button", { class: "btn outline", text: "Print / save as PDF", onclick: () => window.print() }));
    card.appendChild(row);
    main.appendChild(card);

    // Animate score ring from 0 to actual percentage
    (function animateRing() {
      const target = cur.pct;
      const duration = 900;
      const startTime = performance.now();
      const easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
      function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.round(easeOutCubic(progress) * target);
        ring.style.setProperty("--pct", value);
        ringText.textContent = value + "%";
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    })();

    // Play result sound after ring animation completes
    if (window.HTSounds) {
      setTimeout(function () {
        if (cur.pct >= HIGH_PCT) window.HTSounds.play("celebrate");
        else if (cur.pct >= PASS_PCT) window.HTSounds.play("correct");
        else window.HTSounds.play("wrong");
      }, 950);
    }

    const summaryTitle = el("div", { class: "section-title" }, [
      el("h2", { text: "Question-by-question review" }),
      el("small", { text: "Each option shows why it is right or wrong, and what wording change would flip it." }),
    ]);
    main.appendChild(summaryTitle);

    cur.questions.forEach(q => {
      const card = renderQuestionCard(q, cur, /*reveal*/ true);
      const ans = cur.answers[q.id] || {};
      const meta = card.querySelector(".q-meta");
      const scorePill = el("span", { class: "pill", text: `${formatNum(ans.gained || 0)} / ${ans.total || q.points} pts` });
      scorePill.style.background = (ans.gained === ans.total) ? "var(--good-bg)"
                                  : (ans.gained > 0 ? "var(--warn-bg)" : "var(--bad-bg)");
      scorePill.style.color = (ans.gained === ans.total) ? "var(--good)"
                            : (ans.gained > 0 ? "var(--warn)" : "var(--bad)");
      meta.appendChild(scorePill);
      main.appendChild(card);
    });
  }

  function gradeChip(pct) {
    let cls = "fail", label = "Below pass mark";
    if (pct >= HIGH_PCT) { cls = "pass"; label = HIGH_PCT + "%+ — strong pass"; }
    else if (pct >= PASS_PCT) { cls = "borderline"; label = "Pass (" + PASS_PCT + "%+)"; }
    return el("span", { class: "grade " + cls, text: label });
  }

  function formatNum(n) {
    return Number.isInteger(n) ? n : Number(n).toFixed(2).replace(/\.?0+$/, "");
  }

  window.HTMock = {
    renderLanding, renderRunner, renderResult, MOCK_TESTS,
  };
})();
