import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const teams = await prisma.team.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: { users: true }
        },
        lead: {
          select: { id: true, name: true }
        }
      }
    });
    return NextResponse.json({ success: true, message: "Teams fetched successfully", data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch teams", errors: [error.message] }, { status: 500 });
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

    const exists = await prisma.team.findFirst({
      where: { name: body.name, departmentId: body.departmentId, vendorId: session.user.vendorId }
    });

    if (exists) {
      return NextResponse.json({ success: false, message: "Team with this name already exists in the selected department", errors: [] }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: body.name,
        departmentId: body.departmentId,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        leadId: body.leadId || null,
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
        description: `Created Team: ${team.name} in ${team.department.name}`,
      }
    });

    return NextResponse.json({ success: true, message: "Team created successfully", data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create team", errors: [error.message] }, { status: 500 });
  }
}
