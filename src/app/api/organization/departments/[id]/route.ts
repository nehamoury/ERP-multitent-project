import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        headId: body.headId,
        updatedBy: session.user.id,
      }
    });

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
    const department = await prisma.department.delete({
      where: { id: params.id, vendorId: session.user.vendorId },
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
