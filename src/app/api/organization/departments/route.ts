import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const branchId = searchParams.get('branchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      vendorId: session.user.vendorId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(isActive !== null ? { isActive: isActive === 'true' } : { isActive: true }),
      ...(branchId ? { branchId } : {})
    };

    const departments = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { users: true, teams: true, designations: true }
        },
        head: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        }
      }
    });

    const total = await prisma.department.count({ where });

    return NextResponse.json({ 
      success: true, 
      message: "Departments fetched successfully", 
      data: departments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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

    const result = await prisma.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: {
          name: body.name,
          code: body.code || null,
          description: body.description || null,
          isActive: body.isActive !== undefined ? body.isActive : true,
          headId: body.headId || null,
          branchId: body.branchId || null,
          parentDepartmentId: body.parentDepartmentId || null,
          vendorId: session.user.vendorId,
          createdBy: session.user.id,
        }
      });

      // Auto-create Chat Room for the new department
      const chatRoom = await tx.chatRoom.create({
        data: {
          vendorId: session.user.vendorId,
          name: `${department.name} Chat`,
          type: "DEPARTMENT",
          departmentId: department.id,
          createdBy: session.user.id,
        }
      });

      // If a head is assigned, add them to the chat room immediately
      if (department.headId) {
        await tx.chatParticipant.create({
          data: {
            vendorId: session.user.vendorId,
            roomId: chatRoom.id,
            userId: department.headId,
            isAdmin: true,
          }
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          action: "CREATE",
          description: `Created Department: ${department.name}`,
        }
      });

      return department;
    });

    return NextResponse.json({ success: true, message: "Department created successfully", data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create department", errors: [error.message] }, { status: 500 });
  }
}
