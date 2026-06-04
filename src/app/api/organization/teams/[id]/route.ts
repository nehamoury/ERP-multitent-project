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
    const team = await prisma.team.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { 
        name: body.name, 
        departmentId: body.departmentId,
        description: body.description,
        isActive: body.isActive,
        leadId: body.leadId,
        updatedBy: session.user.id,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "UPDATE",
        description: `Updated Team: ${team.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Team updated successfully", data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to update team", errors: [error.message] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const team = await prisma.team.delete({
      where: { id: params.id, vendorId: session.user.vendorId },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "DELETE",
        description: `Deleted Team: ${team.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Team deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to delete team", errors: [error.message] }, { status: 500 });
  }
}
