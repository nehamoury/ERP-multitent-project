import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const branchId = searchParams.get("branchId") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const isActive = searchParams.get("isActive");

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const where: any = { vendorId: session.user.vendorId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== null) where.isActive = isActive === "true";

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          _count: { select: { users: true } },
          lead: { select: { id: true, name: true } }
        }
      }),
      prisma.team.count({ where })
    ]);
    return NextResponse.json({ 
      success: true, 
      message: "Teams fetched successfully", 
      data: teams,
      meta: { total, page, limit }
    });
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
    if (!body.name || !body.departmentId || !body.code) {
      return NextResponse.json({ success: false, message: "Name, Code, and Department ID are required", errors: [] }, { status: 400 });
    }

    const { vendorId } = session.user;

    // Validation: Code Unique within vendor
    const existingCode = await prisma.team.findFirst({ where: { code: body.code, vendorId } });
    if (existingCode) {
      return NextResponse.json({ success: false, message: "Team code must be unique within the vendor", errors: [] }, { status: 400 });
    }

    // Validation: Name unique within department
    const existingName = await prisma.team.findFirst({ where: { name: body.name, departmentId: body.departmentId, vendorId } });
    if (existingName) {
      return NextResponse.json({ success: false, message: "Team with this name already exists in the selected department", errors: [] }, { status: 400 });
    }

    // Validation: Department must exist and branch must exist if provided
    const department = await prisma.department.findUnique({ where: { id: body.departmentId, vendorId } });
    if (!department) return NextResponse.json({ success: false, message: "Department not found", errors: [] }, { status: 404 });

    if (body.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: body.branchId, vendorId } });
      if (!branch) return NextResponse.json({ success: false, message: "Branch not found", errors: [] }, { status: 404 });
    }

    // Validation: Lead must belong to the same department and branch
    if (body.leadId) {
      const lead = await prisma.user.findUnique({ where: { id: body.leadId, vendorId } });
      if (!lead) return NextResponse.json({ success: false, message: "Lead not found", errors: [] }, { status: 404 });
      if (lead.departmentId !== body.departmentId) return NextResponse.json({ success: false, message: "Team Lead must belong to the same department", errors: [] }, { status: 400 });
      if (body.branchId && lead.branchId !== body.branchId) return NextResponse.json({ success: false, message: "Team Lead must belong to the same branch", errors: [] }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: body.name,
          code: body.code,
          departmentId: body.departmentId,
          branchId: body.branchId || null,
          description: body.description || null,
          maxMembers: body.maxMembers ? parseInt(body.maxMembers.toString()) : null,
          isActive: body.isActive !== undefined ? body.isActive : true,
          leadId: body.leadId || null,
          vendorId: session.user.vendorId,
          createdBy: session.user.id,
        },
        include: {
          department: { select: { id: true, name: true } }
        }
      });

      // Create a Team Chat Room
      const chatRoom = await tx.chatRoom.create({
        data: {
          vendorId: session.user.vendorId,
          name: `${team.name} Team Chat`,
          type: "TEAM",
          teamId: team.id,
          createdBy: session.user.id
        }
      });

      // Add the Team Lead to the Chat Room if exists
      if (body.leadId) {
        await tx.chatParticipant.create({
          data: {
            vendorId: session.user.vendorId,
            roomId: chatRoom.id,
            userId: body.leadId,
            isAdmin: true
          }
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          action: "CREATE",
          description: `Created Team: ${team.name}`,
        }
      });

      return team;
    });

    return NextResponse.json({ success: true, message: "Team created successfully", data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create team", errors: [error.message] }, { status: 500 });
  }
}
