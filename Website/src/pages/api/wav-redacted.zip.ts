import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";

const FILE_PATH = process.env.WAV_REDACTED_PATH;

export const GET: APIRoute = async () => {
  if (!FILE_PATH) return new Response("Server misconfigured", { status: 500 });

  try {
    const stat = await fs.promises.stat(FILE_PATH);
    if (!stat.isFile()) return new Response("Not found", { status: 404 });

    const stream = fs.createReadStream(FILE_PATH);
    return new Response(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${path.basename(FILE_PATH)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    if (e?.code === "ENOENT") return new Response("Not found", { status: 404 });
    return new Response("Server error", { status: 500 });
  }
};