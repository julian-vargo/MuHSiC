// public/js/column-modal.js
(() => {
  const payloadEl = document.getElementById("nocodbPayload");
  if (!payloadEl) {
    console.error("[col-modal] missing #nocodbPayload");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(payloadEl.textContent || "{}");
  } catch (e) {
    console.error("[col-modal] payload JSON parse failed", e);
    return;
  }

  const columns = Array.isArray(parsed.columns) ? parsed.columns : [];
  const rows = Array.isArray(parsed.rows) ? parsed.rows : [];

  // --- required DOM ---
  const colBtn = document.getElementById("colBtn");
  const colOverlay = document.getElementById("colOverlay");
  const colPanel = document.getElementById("colPanel");
  const colSearch = document.getElementById("colSearch");
  const colItems = document.getElementById("colItems");
  const colApply = document.getElementById("colApply");
  const colCancel = document.getElementById("colCancel");
  const colCloseX = document.getElementById("colCloseX");

  const exactChk = document.getElementById("exactChk");
  const caseChk = document.getElementById("caseChk");
  const clearBtn = document.getElementById("clearBtn");
  const countCode = document.getElementById("countCode");
  const thead = document.getElementById("thead");
  const tbody = document.getElementById("tbody");
  const filtersWrap = document.getElementById("filtersWrap");

  const missing = [
    colBtn, colOverlay, colPanel, colSearch, colItems, colApply, colCancel, colCloseX,
    exactChk, caseChk, clearBtn, countCode, thead, tbody, filtersWrap,
  ].some((x) => !x);

  if (missing) {
    console.error("[col-modal] missing expected DOM nodes (IDs changed or file mismatch)");
    return;
  }

  // --- utils ---
  const labelByKey = new Map(columns.map((c) => [String(c.key), String(c.label || c.key)]));
  const defaultKeys = columns.slice(0, 6).map((c) => String(c.key)).filter(Boolean);

  let appliedKeys = defaultKeys.length ? defaultKeys : (columns[0] ? [String(columns[0].key)] : []);
  let pendingKeys = [...appliedKeys];

  let filterValues = Object.create(null);
  for (const k of appliedKeys) filterValues[k] = "";

  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const normalize = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const matches = (cellValue, query, exact, caseSensitive) => {
    const raw = normalize(cellValue);
    if (!caseSensitive) {
      const a = raw.toLowerCase();
      const b = query.toLowerCase();
      return exact ? a === b : a.includes(b);
    }
    return exact ? raw === query : raw.includes(query);
  };

  const visibleColumns = () => {
    const keys = appliedKeys.length ? appliedKeys : columns.map((c) => String(c.key));
    const byKey = new Map(columns.map((c) => [String(c.key), c]));
    return keys.map((k) => byKey.get(k)).filter(Boolean);
  };

  const buildHeader = () => {
    const vis = visibleColumns();
    thead.innerHTML = `<tr>${vis
      .map(
        (c) =>
          `<th style="text-align:left; padding:0.5rem; border-bottom:1px solid #ccc; white-space:nowrap;">${esc(
            c.label || c.key
          )}</th>`
      )
      .join("")}</tr>`;
  };

  const filterRows = () => {
    const exact = !!exactChk.checked;
    const caseSensitive = !!caseChk.checked;
    const keys = appliedKeys.length ? appliedKeys : columns.map((c) => String(c.key));

    return rows.filter((r) => {
      for (const k of keys) {
        const q = (filterValues?.[k] ?? "").trim();
        if (!q) continue;
        if (!matches(r?.[k], q, exact, caseSensitive)) return false;
      }
      return true;
    });
  };

  const renderFilters = () => {
    const keys = appliedKeys.length ? appliedKeys : columns.map((c) => String(c.key));
    filtersWrap.innerHTML = keys
      .map((k) => {
        const label = labelByKey.get(k) || k;
        const value = filterValues?.[k] ?? "";
        return `
          <div class="filterRow">
            <div class="filterLabel" title="${esc(label)}">${esc(label)}</div>
            <input class="filterInput" data-key="${esc(k)}" type="text" placeholder="filter ${esc(
              label
            )}…" value="${esc(value)}" />
          </div>
        `;
      })
      .join("");
  };

  const renderTable = (filtered) => {
    const vis = visibleColumns();
    countCode.textContent = String(filtered.length);

    if (!vis.length) {
      thead.innerHTML = "";
      tbody.innerHTML = `<tr><td style="padding:0.75rem;">(No visible columns.)</td></tr>`;
      return;
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td style="padding:0.75rem;" colspan="${vis.length}">(No matches.)</td></tr>`;
      return;
    }

    const cell = (v) => {
      if (v === null || v === undefined || v === "") return `<span style="opacity:0.6;">(empty)</span>`;
      if (typeof v === "object") return `<code style="white-space:pre-wrap;">${esc(JSON.stringify(v))}</code>`;
      return `<code style="white-space:pre-wrap;">${esc(String(v))}</code>`;
    };

    tbody.innerHTML = filtered
      .map((r) => {
        const tds = vis.map(
          (c) =>
            `<td style="padding:0.5rem; border-bottom:1px solid #eee; vertical-align:top;">${cell(
              r?.[c.key]
            )}</td>`
        );
        return `<tr>${tds.join("")}</tr>`;
      })
      .join("");
  };

  const syncButtonLabel = () => {
    if (!columns.length) {
      colBtn.textContent = "No columns";
      return;
    }
    if (!appliedKeys.length) {
      colBtn.textContent = "All columns";
      return;
    }
    const n = appliedKeys.length;
    const labels = appliedKeys
      .map((k) => labelByKey.get(k) || k)
      .filter(Boolean)
      .slice(0, 3);
    colBtn.textContent = n <= 3 ? labels.join(", ") : `${labels.join(", ")} + ${n - 3} more`;
  };

  const refresh = () => {
    buildHeader();
    renderFilters();
    renderTable(filterRows());
    syncButtonLabel();
  };

  // --- modal UI ---
  const renderModalItems = (filterText) => {
    const ft = (filterText || "").toLowerCase().trim();
    const items = columns
      .map((c) => ({ key: String(c.key), label: String(c.label || c.key) }))
      .filter((c) => !ft || c.label.toLowerCase().includes(ft));

    colItems.innerHTML =
      items
        .map((c) => {
          const checked = pendingKeys.includes(c.key);
          return `
            <div class="colItem" role="option" data-key="${esc(c.key)}" aria-selected="${checked ? "true" : "false"}">
              <input class="radioLike" type="checkbox" ${checked ? "checked" : ""} />
              <span>${esc(c.label)}</span>
            </div>
          `;
        })
        .join("") || `<div class="colItem" style="opacity:0.7;">(no matches)</div>`;
  };

  const openModal = () => {
    pendingKeys = [...appliedKeys];
    colOverlay.dataset.open = "true";
    colBtn.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    renderModalItems(colSearch.value || "");
    colSearch.focus();
  };

  const closeModal = () => {
    colOverlay.dataset.open = "false";
    colBtn.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    colBtn.focus();
  };

  const applyPending = () => {
    appliedKeys = [...pendingKeys];
    const next = Object.create(null);
    for (const k of appliedKeys) next[k] = (filterValues && k in filterValues) ? filterValues[k] : "";
    filterValues = next;
    refresh();
  };

  colBtn.addEventListener("click", () => {
    const isOpen = colOverlay.dataset.open === "true";
    if (isOpen) closeModal();
    else openModal();
  });

  colApply.addEventListener("click", () => {
    applyPending();
    closeModal();
  });

  colCancel.addEventListener("click", closeModal);
  colCloseX.addEventListener("click", closeModal);

  colOverlay.addEventListener("pointerdown", (e) => {
    if (e.target === colOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && colOverlay.dataset.open === "true") closeModal();
  });

  colSearch.addEventListener("input", () => renderModalItems(colSearch.value || ""));

  colItems.addEventListener("click", (e) => {
    const el = e.target.closest(".colItem");
    if (!el) return;
    const key = el.getAttribute("data-key");
    if (!key) return;
    const idx = pendingKeys.indexOf(key);
    if (idx >= 0) pendingKeys.splice(idx, 1);
    else pendingKeys.push(key);
    renderModalItems(colSearch.value || "");
  });

  filtersWrap.addEventListener("input", (e) => {
    const el = e.target;
    if (!el || el.tagName !== "INPUT") return;
    const k = el.getAttribute("data-key");
    if (!k) return;
    filterValues[k] = el.value || "";
    renderTable(filterRows());
  });

  exactChk.addEventListener("change", () => renderTable(filterRows()));
  caseChk.addEventListener("change", () => renderTable(filterRows()));

  clearBtn.addEventListener("click", () => {
    exactChk.checked = false;
    caseChk.checked = false;

    appliedKeys = defaultKeys.length ? [...defaultKeys] : (columns[0] ? [String(columns[0].key)] : []);
    pendingKeys = [...appliedKeys];

    filterValues = Object.create(null);
    for (const k of appliedKeys) filterValues[k] = "";

    colSearch.value = "";
    refresh();
  });

  // boot
  refresh();
  console.log("[col-modal] initialized");
})();