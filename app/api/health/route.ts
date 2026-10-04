import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Health check for monitoring and post-deployment verification
export function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.APP_VERSION ?? "dev",
    uptimeSeconds: Math.round(process.uptime()),
  });
}
