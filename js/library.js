/* ==========================================================
   Histo Test — Term library page
   Renders a searchable, filterable list of all terms from the
   resources, grouped by organ system. Definitions retain the
   exact terminology and nomenclature of the source slides.
   ========================================================== */
(function () {
  "use strict";
  const { $, el, escapeHTML, SYSTEMS, systemLabel } = window.HT;

  let state = {
    query: "",
    systems: new Set(SYSTEMS.map(s => s.id)),
  };

  function render() {
    const main = $("#app");

    main.appendChild(el("div", { class: "section-title" }, [
      el("h1", { text: "Term Library" }),
      el("small", { text: `${(window.HISTO_TERMS || []).length} terms · grouped by organ system` }),
    ]));

    main.appendChild(el("p", { class: "muted", text: "All definitions and Latin / Greek nomenclature follow the wording of the lecture slides and cited textbooks. Use the search to jump straight to a term, or toggle organ-system filters." }));

    // Toolbar
    const tb = el("div", { class: "lib-toolbar" });

    const search = el("input", {
      type: "search", placeholder: "Search terms or definitions…",
      "aria-label": "Search terms",
      oninput: (e) => { state.query = e.target.value.trim().toLowerCase(); update(); },
    });
    tb.appendChild(search);

    SYSTEMS.forEach(s => {
      const lbl = el("label", { class: "lib-filter" });
      const cb = el("input", { type: "checkbox" });
      cb.checked = true;
      cb.addEventListener("change", () => {
        if (cb.checked) state.systems.add(s.id); else state.systems.delete(s.id);
        lbl.classList.toggle("active", cb.checked);
        update();
      });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(" " + s.label));
      lbl.classList.add("active");
      tb.appendChild(lbl);
    });

    const count = el("span", { class: "count", id: "lib-count" });
    tb.appendChild(count);

    main.appendChild(tb);

    const container = el("div", { id: "lib-results" });
    main.appendChild(container);

    update();
  }

  function update() {
    const container = $("#lib-results");
    const terms = window.HISTO_TERMS || [];
    const q = state.query;

    const filtered = terms.filter(t => {
      if (!state.systems.has(t.system)) return false;
      if (!q) return true;
      return (t.term + " " + (t.lat || "") + " " + t.def).toLowerCase().includes(q);
    });

    $("#lib-count").textContent = `${filtered.length} of ${terms.length}`;

    container.innerHTML = "";
    if (!filtered.length) {
      container.appendChild(el("p", { class: "empty", text: "No terms match your filters yet — try a wider search." }));
      return;
    }

    // Group by system
    const bySys = {};
    filtered.forEach(t => {
      (bySys[t.system] = bySys[t.system] || []).push(t);
    });

    SYSTEMS.forEach(sys => {
      const list = bySys[sys.id];
      if (!list) return;
      list.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));

      const section = el("section", { class: "lib-section" });
      const title = el("h2");
      title.appendChild(document.createTextNode(sys.label));
      title.appendChild(el("span", { class: "system-count", text: `${list.length} terms` }));
      section.appendChild(title);

      const dl = el("dl");
      list.forEach(t => {
        const wrap = el("div", { class: "lib-term" });
        const dt = el("dt");
        dt.innerHTML = highlight(t.term, q);
        if (t.lat) {
          const ll = document.createElement("span");
          ll.className = "ll";
          ll.innerHTML = "(" + highlight(t.lat, q) + ")";
          dt.appendChild(ll);
        }
        const dd = el("dd");
        dd.innerHTML = highlight(t.def, q);
        if (t.src) {
          const src = el("span", { class: "src", text: "Source: " + t.src });
          dd.appendChild(src);
        }
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        dl.appendChild(wrap);
      });
      section.appendChild(dl);
      container.appendChild(section);
    });
  }

  function highlight(text, q) {
    if (!q) return escapeHTML(text);
    const parts = escapeHTML(text);
    const re = new RegExp("(" + q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + ")", "gi");
    return parts.replace(re, "<mark>$1</mark>");
  }

  window.HTLibrary = { render };
})();
