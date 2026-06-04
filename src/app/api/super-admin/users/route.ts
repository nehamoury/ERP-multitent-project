import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    
    const users = await prisma.user.findMany({
      take: limit,
      include: {
        vendor: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/super-admin/users]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
