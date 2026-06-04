import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller has SUPER_ADMIN role (or is impersonating but originally SUPER_ADMIN)
    const isSuperAdmin = 
      session.user.role === "SUPER_ADMIN" || 
      (session.user as any).originalRole === "SUPER_ADMIN";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Access denied. Super Admin only." }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Retrieve target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendorId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: targetUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
