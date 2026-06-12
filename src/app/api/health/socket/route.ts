import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const socketUrl = process.env.INTERNAL_SOCKET_URL || "http://localhost:3002";

  try {
    const res = await fetch(`${socketUrl}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`Socket returned ${res.status}`);

    const data = await res.json();
    return NextResponse.json({
      status: "ok",
      socket: "connected",
      socketData: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        socket: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
