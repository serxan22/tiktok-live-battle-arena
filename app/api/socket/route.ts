import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    message:
      "Socket.io relay runs as a separate Node process. Start it with npm run realtime or deploy server/realtime-server.mjs to Railway, Render, Fly.io, or a VPS.",
    events: ["room:join", "game:command", "game:snapshot", "room:presence"],
  });
}
