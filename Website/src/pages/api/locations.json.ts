import type { APIRoute } from "astro";

const TABLE_ID = "mmfxx41reqm0yc6";

export const GET: APIRoute = async () => {
const base = import.meta.env.NOCODB_URL;
const token = import.meta.env.NOCODB_TOKEN;

if (!base || !token) {
return new Response(
JSON.stringify({ error: "Missing NOCODB_URL or NOCODB_TOKEN" }),
{ status: 500, headers: { "content-type": "application/json" } }
);
}

// NocoDB v2 REST pattern (common):
// GET {base}/api/v2/tables/{tableId}/records
// If your instance differs, keep the proxy idea and adjust just this URL.
const url = new URL(`${base.replace(/\/$/, "")}/api/v2/tables/${TABLE_ID}/records`);
url.searchParams.set("limit", "10000"); // adjust as needed

const resp = await fetch(url.toString(), {
headers: {
"xc-token": token,
"accept": "application/json",
},
});

if (!resp.ok) {
const text = await resp.text();
return new Response(JSON.stringify({ error: "NocoDB fetch failed", status: resp.status, detail: text }), {
status: 502,
headers: { "content-type": "application/json" },
});
}

const data = await resp.json();

// NocoDB often returns { list: [{...}], pageInfo: ... } but can vary.
const rows = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : [];

const points = rows
.map((r: any) => ({
latitude: typeof r.latitude === "string" ? Number(r.latitude) : r.latitude,
longitude: typeof r.longitude === "string" ? Number(r.longitude) : r.longitude,
}))
.filter((p: any) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

return new Response(JSON.stringify({ points }), {
headers: { "content-type": "application/json", "cache-control": "no-store" },
});
};
