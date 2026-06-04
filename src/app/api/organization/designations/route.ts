import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const isActive = searchParams.get("isActive");

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const where: any = { vendorId: session.user.vendorId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== null) where.isActive = isActive === "true";

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
          _count: {
            select: { users: true }
          }
        }
      }),
      prisma.designation.count({ where })
    ]);
    return NextResponse.json({ 
      success: true, 
      message: "Designations fetched successfully", 
      data: designations,
      meta: { total, page, limit }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch designations", errors: [error.message] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden", errors: [] }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name || !body.departmentId) {
      return NextResponse.json({ success: false, message: "Name and Department ID are required", errors: [] }, { status: 400 });
    }

    const exists = await prisma.designation.findFirst({
      where: { name: body.name, departmentId: body.departmentId, vendorId: session.user.vendorId }
    });

    if (exists) {
      return NextResponse.json({ success: false, message: "Designation with this name already exists in the selected department", errors: [] }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: {
        name: body.name,
        departmentId: body.departmentId,
        level: body.level || null,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        vendorId: session.user.vendorId,
        createdBy: session.user.id,
      },
      include: {
        department: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "CREATE",
        description: `Created Designation: ${designation.name} in ${designation.department.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Designation created successfully", data: designation });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create designation", errors: [error.message] }, { status: 500 });
  }
}
