import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const vendorId = params.id;
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, email: true, phone: true }
        },
        subscription: {
          include: { plan: true }
        },
        _count: {
          select: {
            users: true,
            branches: true,
            departments: true,
            projects: true
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Vendor details API Error:", error);
    return NextResponse.json({ error: "Failed to fetch vendor details" }, { status: 500 });
  }
}
