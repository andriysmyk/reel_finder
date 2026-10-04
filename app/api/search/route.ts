import { NextResponse, type NextRequest } from "next/server";
import { handleError, jsonError } from "@/lib/http";
import { log } from "@/lib/log";
import { searchShows } from "@/lib/tvmaze";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return jsonError(400, "Search query must be at least 2 characters");
  }

  const started = Date.now();
  try {
    const results = await searchShows(query);
    log("info", "search", { route: "/api/search", query, count: results.length, ms: Date.now() - started });
    return NextResponse.json({ query, results });
  } catch (err) {
    return handleError(err, { route: "/api/search", query, ms: Date.now() - started });
  }
}
