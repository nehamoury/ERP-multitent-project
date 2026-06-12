import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const requestSecret = req.headers.get("x-internal-secret");

  if (!internalSecret || requestSecret !== internalSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = params;
  const userId = req.headers.get("x-user-id");
  const vendorId = req.headers.get("x-vendor-id");

  if (!roomId || !userId || !vendorId) {
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  try {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId_vendorId: {
          roomId,
          userId,
          vendorId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ valid: false }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
