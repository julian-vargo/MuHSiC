import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const base = String(import.meta.env.NOCODB_URL || "").trim().replace(/\/+$/, "");
    const token = String(import.meta.env.NOCODB_TOKEN || "").trim();
    const tableId = String(import.meta.env.NOCODB_TABLEID || "").trim();

    if (!base || !token || !tableId) {
      return new Response(
        JSON.stringify({
          error: "Missing NOCODB_URL, NOCODB_TOKEN, or NOCODB_TABLEID",
          hasBase: !!base,
          hasToken: !!token,
          hasTableId: !!tableId,
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    let url: URL;
    try {
      url = new URL(`${base}/api/v2/tables/${tableId}/records`);
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Invalid NOCODB_URL or request URL construction failed",
          base,
          tableId,
          detail: err?.message ?? String(err),
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    url.searchParams.set("limit", "10000");

    let resp: Response;
    try {
      resp = await fetch(url.toString(), {
        headers: {
          "xc-token": token,
          accept: "application/json",
        },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Network error while fetching NocoDB",
          url: url.toString(),
          detail: err?.message ?? String(err),
        }),
        {
          status: 502,
          headers: { "content-type": "application/json" },
        }
      );
    }

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({
          error: "NocoDB fetch failed",
          status: resp.status,
          detail: text,
          url: url.toString(),
        }),
        {
          status: 502,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const data = await resp.json();
    const rows = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : [];

    const points = rows
    .map((r: any) => ({
        latitude:
        typeof r.interviewee_latitude === "string"
            ? Number(r.interviewee_latitude)
            : r.interviewee_latitude,
        longitude:
        typeof r.interviewee_longitude === "string"
            ? Number(r.interviewee_longitude)
            : r.interviewee_longitude,
        code: r.interviewee_participant_code, // ADD THIS
    }))
    .filter((p: any) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

    return new Response(JSON.stringify({ points }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Unhandled locations route error",
        detail: err?.message ?? String(err),
        stack: err?.stack ?? null,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
};