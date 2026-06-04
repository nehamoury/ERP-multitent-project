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
    const branch = await prisma.branch.delete({
      where: { id: params.id, vendorId: session.user.vendorId },
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
