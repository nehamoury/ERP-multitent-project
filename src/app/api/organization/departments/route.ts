import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const departments = await prisma.department.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, teams: true, designations: true }
        },
        head: {
          select: { id: true, name: true }
        }
      }
    });
    return NextResponse.json({ success: true, message: "Departments fetched successfully", data: departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch departments", errors: [error.message] }, { status: 500 });
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
      return NextResponse.json({ success: false, message: "Department name is required", errors: [] }, { status: 400 });
    }

    const exists = await prisma.department.findFirst({
      where: { name: body.name, vendorId: session.user.vendorId }
    });

    if (exists) {
      return NextResponse.json({ success: false, message: "Department with this name already exists", errors: [] }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: body.name,
        code: body.code || null,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        headId: body.headId || null,
        vendorId: session.user.vendorId,
        createdBy: session.user.id,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "CREATE",
        description: `Created Department: ${department.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Department created successfully", data: department });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create department", errors: [error.message] }, { status: 500 });
  }
}
