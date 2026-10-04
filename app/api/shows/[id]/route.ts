import { NextResponse, type NextRequest } from "next/server";
import { handleError, jsonError } from "@/lib/http";
import { log } from "@/lib/log";
import { getShow } from "@/lib/tvmaze";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return jsonError(400, "Show id must be a number");
  }

  const started = Date.now();
  try {
    const show = await getShow(Number(id));
    log("info", "show", { route: "/api/shows/[id]", id, ms: Date.now() - started });
    return NextResponse.json(show);
  } catch (err) {
    return handleError(err, { route: "/api/shows/[id]", id, ms: Date.now() - started });
  }
}
