import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const branch = await prisma.branch.findUnique({
      where: { id: params.id, vendorId: session.user.vendorId },
      include: {
        manager: {
          select: { id: true, name: true, email: true, phone: true }
        },
        _count: {
          select: { users: true, departments: true, teams: true }
        }
      }
    });

    if (!branch) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });
    }

    // Since Project model doesn't have a branchId yet, we count projects by users in the branch who are managers, 
    // or we just return 0 for now as project association needs a direct relationship or complex traversal.
    // Let's add a dummy project count for now and we can improve later.
    const projectCount = 0; 

    return NextResponse.json({ 
      success: true, 
      data: {
        ...branch,
        _count: {
          ...branch._count,
          projects: projectCount
        }
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch branch details", errors: [error.message] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const branch = await prisma.branch.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { 
        name: body.name, 
        code: body.code,
        location: body.location,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        contactPerson: body.contactPerson,
        contactNumber: body.contactNumber,
        isActive: body.isActive,
        managerId: body.managerId,
        updatedBy: session.user.id,
      }
    });

    if (body.managerId) {
      const managerUser = await prisma.user.findUnique({ where: { id: body.managerId } });
      if (managerUser) {
        await prisma.user.update({
          where: { id: body.managerId },
          data: {
            branchId: branch.id,
            role: managerUser.role === "EMPLOYEE" ? "BRANCH_MANAGER" : managerUser.role
          }
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "UPDATE",
        description: `Updated Branch: ${branch.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Branch updated successfully", data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to update branch", errors: [error.message] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const branch = await prisma.branch.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { isActive: false, updatedBy: session.user.id }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "DELETE",
        description: `Deleted Branch: ${branch.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Branch deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to delete branch", errors: [error.message] }, { status: 500 });
  }
}
