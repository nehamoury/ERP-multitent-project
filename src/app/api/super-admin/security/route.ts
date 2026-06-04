import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const recentLogins = await prisma.activityLog.findMany({
      where: { action: "LOGIN" },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { name: true } },
        user: { select: { name: true, email: true, role: true } }
      }
    });

    return NextResponse.json({ recentLogins });
  } catch (error) {
    console.error("[GET /api/super-admin/security]", error);
    return NextResponse.json({ error: "Failed to fetch security data" }, { status: 500 });
  }
}
