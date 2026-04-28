/* ==========================================================
   Histo Test — Term library page
   Searchable, filterable list grouped by system.
   Systems collapse by default; subsections group each system.
   ========================================================== */
(function () {
  "use strict";
  const { $, el, escapeHTML, SYSTEMS, systemLabel, SYS_ABBR } = window.HT;

  // ── Subsection membership (exact term names from data/terms.js) ───────────
  const SUB = {
    GIT: [
      { label: "GIT wall layers", s: new Set(["Lamina propria","Muscularis mucosae","Submucosa","Tunica muscularis (digestive tract)","Serosa vs. adventitia","Myenteric plexus (Auerbach's)","Submucosal plexus (Meissner's)","Stratified squamous non-keratinised epithelium"]) },
      { label: "Oral cavity & tongue", s: new Set(["Masticatory mucosa","Tongue papillae","von Ebner's glands","Taste bud"]) },
      { label: "Salivary glands", s: new Set(["Salivary gland — parotid","Salivary gland — submandibular","Salivary gland — sublingual","Intercalated duct (salivary)","Striated duct (salivary)","Myoepithelial cells","Serous demilunes (Gianuzzi crescents)"]) },
      { label: "Teeth & periodontium", s: new Set(["Tooth — enamel","Tooth — dentin","Tooth — cementum","Pulp","Periodontal ligament","Junctional epithelium","Tooth development — enamel knot","Tooth development — bell stage","Odontoblasts"]) },
      { label: "Oesophagus", s: new Set(["Oesophagus"]) },
      { label: "Stomach", s: new Set(["Stomach — surface mucous cells","Stomach — parietal cells","Stomach — chief (zymogenic) cells","Stomach — mucous neck cells","Stomach — enteroendocrine cells","Cardia / pyloric glands"]) },
      { label: "Small intestine", s: new Set(["Small intestine — villi","Small intestine — crypts of Lieberkühn","Enterocytes (absorptive cells)","Goblet cells","Paneth cells","Intestinal stem cells","Brunner's glands","Peyer's patches","M cells","Plicae circulares (Kerckring's folds)"]) },
      { label: "Large intestine & anal canal", s: new Set(["Large intestine","Vermiform appendix","Anal canal — zones"]) },
      { label: "Liver & biliary system", s: new Set(["Liver — classical (hepatic) lobule","Hepatocytes","Sinusoids (hepatic)","Kupffer cells","Space of Disse","Hepatic stellate (Ito) cells","Bile canaliculi","Cholangiocytes","Gallbladder"]) },
      { label: "Pancreas", s: new Set(["Pancreas — exocrine portion","Centroacinar cells","Islets of Langerhans"]) },
    ],
    CVS: [
      { label: "Vessel wall", s: new Set(["Tunica intima","Tunica media","Tunica adventitia"]) },
      { label: "Arteries & arterioles", s: new Set(["Elastic (conducting) artery","Muscular (distributing) artery","Arteriole"]) },
      { label: "Capillaries", s: new Set(["Capillaries","Continuous capillary","Fenestrated capillary","Sinusoid (discontinuous capillary)"]) },
      { label: "Veins", s: new Set(["Vein — valves"]) },
      { label: "Heart", s: new Set(["Heart wall — endocardium","Heart wall — myocardium","Heart wall — epicardium (visceral pericardium)","Purkinje fibres","Intercalated disc","Sinoatrial (SA) node"]) },
    ],
    Lymphatic: [
      { label: "Overview", s: new Set(["Primary (central) lymphoid organs","Secondary (peripheral) lymphoid organs","Reticular fibres"]) },
      { label: "Lymph node", s: new Set(["Lymph node — paracortex","Lymph node — medulla","High endothelial venules (HEVs)"]) },
      { label: "Thymus", s: new Set(["Thymus — cortex","Thymus — medulla","Hassall's corpuscle","Blood-thymus barrier"]) },
      { label: "Spleen", s: new Set(["Spleen — white pulp","Spleen — red pulp","Central artery (spleen)"]) },
      { label: "Other lymphoid tissue", s: new Set(["Tonsils","MALT"]) },
    ],
    Respiratory: [
      { label: "Upper airways", s: new Set(["Respiratory epithelium","Olfactory epithelium","Larynx","Trachea"]) },
      { label: "Conducting airways", s: new Set(["Bronchi (intrapulmonary)","Bronchioles","Clara (club) cells","Respiratory bronchiole"]) },
      { label: "Gas exchange zone", s: new Set(["Alveolar duct, sac and alveoli","Type I pneumocyte","Type II pneumocyte","Air-blood barrier","Alveolar macrophage (\"dust cell\")"]) },
    ],
    Urinary: [
      { label: "Renal corpuscle & filtration", s: new Set(["Renal cortex","Renal medulla","Renal corpuscle","Glomerulus","Bowman's capsule","Podocytes","Glomerular filtration barrier","Mesangial cells"]) },
      { label: "Nephron tubules", s: new Set(["Proximal convoluted tubule (PCT)","Loop of Henle","Distal convoluted tubule (DCT)","Macula densa","Juxtaglomerular cells","Juxtaglomerular apparatus","Collecting duct"]) },
      { label: "Lower urinary tract", s: new Set(["Urothelium (transitional epithelium)","Ureter","Urinary bladder","Female urethra","Male urethra"]) },
    ],
    MaleGenital: [
      { label: "Testis", s: new Set(["Tunica albuginea (testis)","Seminiferous tubules","Spermatogonia","Primary spermatocyte","Spermatids","Sertoli cells","Blood-testis barrier","Leydig cells"]) },
      { label: "Duct system", s: new Set(["Rete testis","Efferent ductules","Ductus epididymidis","Ductus deferens"]) },
      { label: "Accessory glands & external", s: new Set(["Seminal vesicles","Prostate gland","Penis — corpora cavernosa and corpus spongiosum"]) },
    ],
    FemaleGenital: [
      { label: "Ovary & follicles", s: new Set(["Ovary — cortex / medulla","Primordial follicle","Primary follicle","Secondary (antral) follicle","Mature (Graafian) follicle","Corpus luteum","Atretic follicle"]) },
      { label: "Uterine tube & uterus", s: new Set(["Uterine tube — segments","Uterus — endometrium","Endometrial cycle phases","Myometrium","Cervix — cervical canal","Vagina"]) },
      { label: "Pregnancy & breast", s: new Set(["Placenta","Mammary gland — non-lactating","Mammary gland — lactating"]) },
    ],
    Endocrine: [
      { label: "Pituitary", s: new Set(["Adenohypophysis — pars distalis","Pars intermedia","Neurohypophysis — pars nervosa"]) },
      { label: "Thyroid & parathyroid", s: new Set(["Thyroid follicle","Parafollicular (C) cells","Parathyroid chief (principal) cells","Parathyroid oxyphil cells"]) },
      { label: "Adrenal gland", s: new Set(["Adrenal cortex — zona glomerulosa","Adrenal cortex — zona fasciculata","Adrenal cortex — zona reticularis","Adrenal medulla"]) },
      { label: "Other endocrine", s: new Set(["Pineal gland — pinealocytes","Islet β-cells","Islet α-cells"]) },
    ],
    Nervous: [
      { label: "Neuron types", s: new Set(["Neuron — types by processes"]) },
      { label: "CNS glia", s: new Set(["Astrocytes","Oligodendrocytes","Microglia","Ependymal cells"]) },
      { label: "Peripheral nervous system", s: new Set(["Schwann cells","Satellite cells","Node of Ranvier","Nerve — endoneurium / perineurium / epineurium"]) },
      { label: "Spinal cord", s: new Set(["Spinal cord — anterior (ventral) horns","Spinal cord — posterior (dorsal) horns"]) },
      { label: "Cerebellum", s: new Set(["Cerebellar cortex — Purkinje cells","Cerebellar cortex — granular layer","Cerebellar cortex — molecular layer"]) },
      { label: "Cerebral cortex", s: new Set(["Cerebral cortex — six layers","Vestibulocochlear ganglion"]) },
    ],
    Integument: [
      { label: "Epidermis & cells", s: new Set(["Epidermis — strata","Keratinocytes","Melanocytes","Langerhans cells","Merkel cells"]) },
      { label: "Dermis & hypodermis", s: new Set(["Dermis — papillary / reticular","Hypodermis (subcutis)"]) },
      { label: "Glands", s: new Set(["Eccrine sweat gland","Apocrine sweat gland","Sebaceous gland"]) },
      { label: "Hair & nails", s: new Set(["Hair follicle","Nail"]) },
      { label: "Sensory receptors", s: new Set(["Meissner's corpuscle","Pacinian corpuscle"]) },
    ],
  };

  function getSubLabel(sysId, termName) {
    const subs = SUB[sysId];
    if (!subs) return null;
    for (const sub of subs) {
      if (sub.s.has(termName)) return sub.label;
    }
    return null;
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let state = {
    query: "",
    systems: new Set(SYSTEMS.map(s => s.id)),
  };

  // ── Render (called once on page load) ─────────────────────────────────────
  function render() {
    const main = $("#app");

    main.appendChild(el("div", { class: "section-title" }, [
      el("h1", { text: "Term Library" }),
      el("small", { text: `${(window.HISTO_TERMS || []).length} terms · click a system to expand` }),
    ]));

    const tb = el("div", { class: "lib-toolbar" });

    const search = el("input", {
      type: "search", placeholder: "Search terms or definitions…",
      "aria-label": "Search terms",
      oninput: (e) => { state.query = e.target.value.trim().toLowerCase(); update(); },
    });
    tb.appendChild(search);

    SYSTEMS.forEach(s => {
      const lbl = el("label", { class: "lib-filter", dataset: { sys: s.id } });
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

    tb.appendChild(el("span", { class: "count", id: "lib-count" }));
    main.appendChild(tb);
    main.appendChild(el("div", { id: "lib-results" }));
    update();
  }

  // ── Update (called on every filter/search change) ─────────────────────────
  function update() {
    const container = $("#lib-results");
    const terms = window.HISTO_TERMS || [];
    const q = state.query;
    const hasQuery = q.length > 0;

    const filtered = terms.filter(t => {
      if (!state.systems.has(t.system)) return false;
      if (!q) return true;
      return (t.term + " " + (t.lat || "") + " " + t.def).toLowerCase().includes(q);
    });

    $("#lib-count").textContent = `${filtered.length} of ${terms.length}`;

    container.innerHTML = "";
    if (!filtered.length) {
      container.appendChild(el("p", { class: "empty", text: "No terms match — try a wider search." }));
      return;
    }

    const bySys = {};
    filtered.forEach(t => { (bySys[t.system] = bySys[t.system] || []).push(t); });

    SYSTEMS.forEach(sys => {
      const list = bySys[sys.id];
      if (!list) return;

      const section = el("section", { class: "lib-section" + (hasQuery ? " open" : ""), dataset: { sys: sys.id } });

      // Clickable header
      const hdr = el("div", { class: "lib-section-header" });
      const icon = el("span", { class: "sys-icon", text: SYS_ABBR[sys.id] || sys.id.slice(0, 2) });
      const h2 = el("h2");
      h2.appendChild(document.createTextNode(sys.label));
      h2.appendChild(el("span", { class: "system-count", text: `${list.length} terms` }));
      const chevron = el("span", { class: "chevron", text: "›" });
      hdr.appendChild(icon);
      hdr.appendChild(h2);
      hdr.appendChild(chevron);
      hdr.addEventListener("click", () => {
        section.classList.toggle("open");
        if (window.HTSounds) window.HTSounds.play("click");
      });
      section.appendChild(hdr);

      // Collapsible body
      const body = el("div", { class: "lib-section-body" });
      const inner = el("div", { class: "lib-section-body-inner" });

      const subs = SUB[sys.id];
      if (subs) {
        const subsMap = {};
        const fallback = [];
        list.forEach(t => {
          const subLabel = getSubLabel(sys.id, t.term);
          if (subLabel) (subsMap[subLabel] = subsMap[subLabel] || []).push(t);
          else fallback.push(t);
        });

        subs.forEach((sub, i) => {
          const subList = subsMap[sub.label];
          if (!subList || !subList.length) return;
          subList.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
          const subHdr = el("div", { class: "lib-subsection" + (i === 0 ? " first" : ""), text: sub.label });
          inner.appendChild(subHdr);
          const dl = el("dl");
          subList.forEach(t => renderTerm(dl, t, q, hasQuery));
          inner.appendChild(dl);
        });

        if (fallback.length) {
          fallback.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
          const dl = el("dl");
          fallback.forEach(t => renderTerm(dl, t, q, hasQuery));
          inner.appendChild(dl);
        }
      } else {
        list.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
        const dl = el("dl");
        list.forEach(t => renderTerm(dl, t, q, hasQuery));
        inner.appendChild(dl);
      }

      body.appendChild(inner);
      section.appendChild(body);
      container.appendChild(section);
    });
  }

  function renderTerm(dl, t, q, open) {
    const wrap = el("div", { class: "lib-term" + (open ? " open" : "") });
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
    if (t.src) dd.appendChild(el("span", { class: "src", text: "Source: " + t.src }));
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    wrap.addEventListener("click", (e) => { e.stopPropagation(); wrap.classList.toggle("open"); });
    dl.appendChild(wrap);
  }

  function highlight(text, q) {
    if (!q) return escapeHTML(text);
    const safe = escapeHTML(text);
    const re = new RegExp("(" + q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  window.HTLibrary = { render };
})();
