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
    const designation = await prisma.designation.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { 
        name: body.name, 
        departmentId: body.departmentId,
        level: body.level,
        description: body.description,
        isActive: body.isActive,
        updatedBy: session.user.id,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "UPDATE",
        description: `Updated Designation: ${designation.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Designation updated successfully", data: designation });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to update designation", errors: [error.message] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const designation = await prisma.designation.delete({
      where: { id: params.id, vendorId: session.user.vendorId },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "DELETE",
        description: `Deleted Designation: ${designation.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Designation deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to delete designation", errors: [error.message] }, { status: 500 });
  }
}
