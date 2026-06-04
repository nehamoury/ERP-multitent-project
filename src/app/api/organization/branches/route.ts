import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const branches = await prisma.branch.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true }
        },
        manager: {
          select: { id: true, name: true }
        }
      }
    });
    return NextResponse.json({ success: true, message: "Branches fetched successfully", data: branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch branches", errors: [error.message] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden", errors: [] }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: "Branch name is required", errors: [] }, { status: 400 });
    }

    const exists = await prisma.branch.findFirst({
      where: { name: body.name, vendorId: session.user.vendorId }
    });

    if (exists) {
      return NextResponse.json({ success: false, message: "Branch with this name already exists", errors: [] }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        code: body.code || null,
        location: body.location || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        contactPerson: body.contactPerson || null,
        contactNumber: body.contactNumber || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        managerId: body.managerId || null,
        vendorId: session.user.vendorId,
        createdBy: session.user.id,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "CREATE",
        description: `Created Branch: ${branch.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Branch created successfully", data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create branch", errors: [error.message] }, { status: 500 });
  }
}
