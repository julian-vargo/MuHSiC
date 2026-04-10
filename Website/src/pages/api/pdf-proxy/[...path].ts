import type { APIRoute } from "astro";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return b && p ? `${b}/${p}` : "";
}

export const GET: APIRoute = async ({ params, request }) => {
  const rawPath = String(params.path || "").trim();
  const nocodbBaseUrl = String(import.meta.env.NOCODB_BASE_URL || "").trim().replace(/\/+$/, "");

  if (!nocodbBaseUrl) {
    return new Response("Missing NOCODB_BASE_URL", { status: 500 });
  }

  if (!rawPath) {
    return new Response("Missing file path", { status: 400 });
  }

  const upstreamUrl = joinUrl(nocodbBaseUrl, rawPath);

  const upstream = await fetch(upstreamUrl, {
    headers: {
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    },
  });

  if (!upstream.ok) {
    return new Response(`Upstream fetch failed: ${upstream.status}`, {
      status: upstream.status,
    });
  }

  const contentType = upstream.headers.get("content-type") || "application/pdf";
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
    },
  });
};