import { NextResponse } from "next/server";
import { log } from "./log";
import { UpstreamError } from "./tvmaze";
import type { ApiError } from "./types";

export function jsonError(status: number, error: string) {
  return NextResponse.json<ApiError>({ error }, { status });
}

// Centralized error handling: convert errors to HTTP responses and log them
export function handleError(err: unknown, context: Record<string, unknown>) {
  if (err instanceof UpstreamError) {
    log(err.status >= 500 ? "error" : "warn", err.message, { ...context, status: err.status });
    return jsonError(err.status, err.message);
  }
  log("error", "Unexpected error", { ...context, error: String(err) });
  return jsonError(500, "Something went wrong on our side");
}
