import { NextResponse } from "next/server";
import { resolvePublicDownloadFile } from "@/components/website/downloads";

export async function GET(_request, { params }) {
  const { id } = await params;
  const result = await resolvePublicDownloadFile(id);
  if (result.status === "ok") {
    const response = NextResponse.redirect(result.url, 307);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return new Response(result.status === "error" ? "Download vorübergehend nicht verfügbar." : "Nicht gefunden.", {
    status: result.status === "error" ? 500 : 404,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}
