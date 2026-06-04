import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id, vendorId: session.user.vendorId },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true, employeeId: true, email: true, profileImage: true } },
        users: {
          where: { isActive: true },
          select: {
            id: true, name: true, employeeId: true, role: true, designation: { select: { name: true } },
            profileImage: true
          }
        }
      }
    });

    if (!team) return NextResponse.json({ success: false, message: "Team not found", errors: [] }, { status: 404 });

    return NextResponse.json({ success: true, message: "Team fetched successfully", data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch team", errors: [error.message] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden", errors: [] }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { vendorId } = session.user;

    const existingTeam = await prisma.team.findUnique({
      where: { id: params.id, vendorId }
    });
    if (!existingTeam) return NextResponse.json({ success: false, message: "Team not found", errors: [] }, { status: 404 });

    // Validate unique code
    if (body.code && body.code !== existingTeam.code) {
      const existingCode = await prisma.team.findFirst({ where: { code: body.code, vendorId } });
      if (existingCode) return NextResponse.json({ success: false, message: "Team code must be unique within the vendor", errors: [] }, { status: 400 });
    }

    // Validate unique name in department
    const targetDeptId = body.departmentId || existingTeam.departmentId;
    if (body.name && (body.name !== existingTeam.name || targetDeptId !== existingTeam.departmentId)) {
      const existingName = await prisma.team.findFirst({ where: { name: body.name, departmentId: targetDeptId, vendorId } });
      if (existingName) return NextResponse.json({ success: false, message: "Team with this name already exists in the selected department", errors: [] }, { status: 400 });
    }

    // Validate lead
    if (body.leadId && body.leadId !== existingTeam.leadId) {
      const targetBranchId = body.branchId !== undefined ? body.branchId : existingTeam.branchId;
      const lead = await prisma.user.findUnique({ where: { id: body.leadId, vendorId } });
      if (!lead) return NextResponse.json({ success: false, message: "Lead not found", errors: [] }, { status: 404 });
      if (lead.departmentId !== targetDeptId) return NextResponse.json({ success: false, message: "Team Lead must belong to the same department", errors: [] }, { status: 400 });
      if (targetBranchId && lead.branchId !== targetBranchId) return NextResponse.json({ success: false, message: "Team Lead must belong to the same branch", errors: [] }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: params.id, vendorId },
        data: {
          name: body.name,
          code: body.code,
          departmentId: body.departmentId,
          branchId: body.branchId,
          description: body.description,
          maxMembers: body.maxMembers ? parseInt(body.maxMembers.toString()) : null,
          isActive: body.isActive,
          leadId: body.leadId,
          updatedBy: session.user.id
        }
      });

      // Handle chat sync if lead changes
      if (body.leadId && body.leadId !== existingTeam.leadId) {
        const chatRoom = await tx.chatRoom.findFirst({
          where: { teamId: team.id, vendorId }
        });

        if (chatRoom) {
          // Remove old lead's admin rights if they were the lead
          if (existingTeam.leadId) {
            await tx.chatParticipant.deleteMany({
              where: { roomId: chatRoom.id, userId: existingTeam.leadId }
            });
          }
          // Add new lead as admin
          await tx.chatParticipant.upsert({
            where: {
              roomId_userId_vendorId: { roomId: chatRoom.id, userId: body.leadId, vendorId }
            },
            update: { isAdmin: true },
            create: { roomId: chatRoom.id, userId: body.leadId, vendorId, isAdmin: true }
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id, vendorId, action: "UPDATE",
          description: `Updated Team: ${team.name}`,
        }
      });
      return team;
    });

    return NextResponse.json({ success: true, message: "Team updated successfully", data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to update team", errors: [error.message] }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden", errors: [] }, { status: 403 });
  }

  try {
    const team = await prisma.team.update({
      where: { id: params.id, vendorId: session.user.vendorId },
      data: { isActive: false, updatedBy: session.user.id }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id, vendorId: session.user.vendorId, action: "DELETE",
        description: `Soft deleted Team: ${team.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Team deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to delete team", errors: [error.message] }, { status: 500 });
  }
}
