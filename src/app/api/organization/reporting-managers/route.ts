import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    // Fetch active users who can potentially be reporting managers
    // Usually, this could be anyone, or restricted by role depending on company policy.
    // Here we fetch all active users in the same organization.
    const managers = await prisma.user.findMany({
      where: { vendorId: session.user.vendorId, isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        role: true,
        department: { select: { name: true } },
        designation: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, message: "Reporting managers fetched successfully", data: managers });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch reporting managers", errors: [error.message] }, { status: 500 });
  }
}
