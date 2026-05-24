import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    message:
      "Socket.io handoff endpoint placeholder. Use lib/realtime/socketTypes.ts with a dedicated Node server for Railway, Render, or VPS deployment.",
    events: ["room:join", "game:command", "game:snapshot", "room:presence"],
  });
}
