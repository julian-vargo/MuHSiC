import fs from "fs";
import path from "path";
import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { canRead } from "../../lib/auth";

const SECURE_FOLDER = "/var/www/secure_downloads";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!canRead(session)) {
    return new Response("Access denied", { status: 403 });
  }

  const url = new URL(request.url);
  const fileKey = url.searchParams.get("file");

  const fileMap: Record<string, string> = {
    wav: path.join(SECURE_FOLDER, "full_corpus_wav.zip"),
    pdf: path.join(SECURE_FOLDER, "full_corpus_transcripts_pdfs.zip"),
    docx: path.join(SECURE_FOLDER, "full_corpus_transcripts_docx.zip"),
    parquet: path.join(SECURE_FOLDER, "acoustic_output.parquet"),
  };

  if (!fileKey || !fileMap[fileKey]) {
    return new Response("Invalid file requested", { status: 404 });
  }

  const filePath = fileMap[fileKey];
  if (!fs.existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);

  const readableStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
  });

  const headers = new Headers();
  headers.set("Content-Type", "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${path.basename(filePath)}"`,
  );

  return new Response(readableStream, { headers });
};
