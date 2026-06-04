import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncDepartmentChatMembers } from "@/lib/chat-sync";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id, vendorId: session.user.vendorId },
      include: {
        head: {
          select: { id: true, name: true, employeeId: true, email: true, profileImage: true }
        },
        branch: {
          select: { id: true, name: true }
        },
        parentDepartment: {
          select: { id: true, name: true }
        },
        teams: {
          orderBy: { name: 'asc' },
          include: {
            lead: { select: { id: true, name: true } },
            _count: { select: { users: true } }
          }
        },
        users: {
          where: { isActive: true },
          select: {
            id: true, name: true, employeeId: true, role: true, designation: { select: { name: true } },
            team: { select: { name: true } }, profileImage: true
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ success: false, message: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch department details", errors: [error.message] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const department = await prisma.department.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { 
        name: body.name,
        code: body.code,
        description: body.description,
        isActive: body.isActive,
        headId: body.headId || null,
        branchId: body.branchId || null,
        parentDepartmentId: body.parentDepartmentId || null,
        updatedBy: session.user.id,
      }
    });

    if (body.headId !== undefined) {
      await syncDepartmentChatMembers(department.id, session.user.vendorId);
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "UPDATE",
        description: `Updated Department: ${department.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Department updated successfully", data: department });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to update department", errors: [error.message] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const department = await prisma.department.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { isActive: false, updatedBy: session.user.id }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "DELETE",
        description: `Deleted Department: ${department.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Department deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to delete department", errors: [error.message] }, { status: 500 });
  }
}
