const NOCODB_URL = import.meta.env.NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.NOCODB_TOKEN;
const NOCODB_TABLEID = import.meta.env.NOCODB_TABLEID;
const NOCODB_VIEWID = import.meta.env.NOCODB_VIEWID;

function mustEnv() {
  if (!NOCODB_URL || !NOCODB_TOKEN || !NOCODB_TABLEID) {
    throw new Error("Missing NOCODB_URL, NOCODB_TOKEN, or NOCODB_TABLEID");
  }
  return {
    url: String(NOCODB_URL).replace(/\/$/, ""),
    token: String(NOCODB_TOKEN),
    tableId: String(NOCODB_TABLEID),
    viewId: NOCODB_VIEWID ? String(NOCODB_VIEWID) : null,
  };
}

export function getTableIdFromEnv() {
  return mustEnv().tableId;
}

export function getViewIdFromEnv() {
  return mustEnv().viewId;
}

export async function nocodbFetch(path: string) {
  const { url, token } = mustEnv();
  const res = await fetch(`${url}${path}`, {
    cache: "no-store",
    headers: { "xc-token": token, accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NocoDB error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getColumnsFromMeta(tableId: string) {
  const meta = await nocodbFetch(`/api/v1/db/meta/tables/${tableId}`);

  const rawCols =
    (Array.isArray(meta?.columns) && meta.columns) ||
    (Array.isArray(meta?.columns?.list) && meta.columns.list) ||
    (Array.isArray(meta?.fields) && meta.fields) ||
    [];

  const columns = rawCols
    .filter((c: any) => c && (c.show ?? true))
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((c: any) => ({
      key: String(c.column_name ?? c.name ?? c.title ?? ""),
      label: String(c.title ?? c.column_name ?? c.name ?? ""),
      order: Number(c.order ?? 0),
    }))
    .filter((c: any) => c.key);

  return { meta, columns };
}

export async function getAllRows(tableId: string, pageSize = 200) {
  const rows: any[] = [];
  const MAX_PAGES = 5000;

  // Helper: normalize various NocoDB list response shapes
  function extractList(res: any): any[] {
    if (Array.isArray(res?.list)) return res.list;
    if (Array.isArray(res?.records)) return res.records;
    if (Array.isArray(res)) return res;
    return [];
  }

  // IMPORTANT:
  // Try v2 first (most common modern/self-hosted), then v3, then your old v1 routes (last resort).
  const candidates: Array<(limit: number, offset: number) => string> = [
    // v2
    (limit, offset) => `/api/v2/tables/${encodeURIComponent(tableId)}/records?limit=${limit}&offset=${offset}`,
    // v3 (if enabled)
    (limit, offset) => `/api/v3/tables/${encodeURIComponent(tableId)}/records?limit=${limit}&offset=${offset}`,

    // legacy fallbacks (probably dead on your instance)
    (limit, offset) => `/api/v1/db/data/v1/${encodeURIComponent(tableId)}?limit=${limit}&offset=${offset}`,
  ];

  async function tryProbe(url: string) {
    const res = await nocodbFetch(url);
    const list = extractList(res);
    return list;
  }

  // Find a working endpoint
  let listFn: ((limit: number, offset: number) => string) | null = null;
  const tried: string[] = [];

  for (const fn of candidates) {
    const probeUrl = fn(1, 0);
    tried.push(probeUrl);
    try {
      const probe = await tryProbe(probeUrl);
      // “working” means: request succeeded AND returned an array (possibly empty)
      if (Array.isArray(probe)) {
        listFn = fn;
        break;
      }
    } catch {
      // keep trying
    }
  }

  if (!listFn) {
    throw new Error(
      `Could not find a working NocoDB list endpoint.\nTried:\n${tried.join("\n")}`
    );
  }

  // Paginate
  let offset = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await nocodbFetch(listFn(pageSize, offset));
    const page = extractList(res);

    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

export function prettyLabel(k: string) {
  if (!k) return "";
  return k[0].toUpperCase() + k.replaceAll("_", " ").slice(1);
}