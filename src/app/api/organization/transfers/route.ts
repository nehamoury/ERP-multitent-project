import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const transfers = await prisma.employeeTransfer.findMany({
      where: {
        vendorId: session.user.vendorId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        employee: { select: { id: true, name: true, employeeId: true, profileImage: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // To get the names of departments/teams/branches, we need to manually fetch them or rely on client caching.
    // Let's do a join-like mapping to enrich the response.
    const uniqueIds = new Set<string>();
    transfers.forEach((t: any) => {
      if (t.oldBranchId) uniqueIds.add(t.oldBranchId);
      if (t.newBranchId) uniqueIds.add(t.newBranchId);
      if (t.oldDepartmentId) uniqueIds.add(t.oldDepartmentId);
      if (t.newDepartmentId) uniqueIds.add(t.newDepartmentId);
      if (t.oldTeamId) uniqueIds.add(t.oldTeamId);
      if (t.newTeamId) uniqueIds.add(t.newTeamId);
    });

    const [branches, departments, teams] = await Promise.all([
      prisma.branch.findMany({ where: { id: { in: Array.from(uniqueIds) } }, select: { id: true, name: true } }),
      prisma.department.findMany({ where: { id: { in: Array.from(uniqueIds) } }, select: { id: true, name: true } }),
      prisma.team.findMany({ where: { id: { in: Array.from(uniqueIds) } }, select: { id: true, name: true } }),
    ]);

    const entityMap = new Map();
    branches.forEach(b => entityMap.set(b.id, b.name));
    departments.forEach(d => entityMap.set(d.id, d.name));
    teams.forEach((t: any) => entityMap.set(t.id, t.name));

    const enrichedTransfers = transfers.map((t: any) => ({
      ...t,
      oldBranchName: t.oldBranchId ? entityMap.get(t.oldBranchId) : null,
      newBranchName: t.newBranchId ? entityMap.get(t.newBranchId) : null,
      oldDepartmentName: t.oldDepartmentId ? entityMap.get(t.oldDepartmentId) : null,
      newDepartmentName: t.newDepartmentId ? entityMap.get(t.newDepartmentId) : null,
      oldTeamName: t.oldTeamId ? entityMap.get(t.oldTeamId) : null,
      newTeamName: t.newTeamId ? entityMap.get(t.newTeamId) : null,
    }));

    return NextResponse.json({ success: true, data: enrichedTransfers });
  } catch (error: any) {
    console.error("Transfers fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, newBranchId, newDepartmentId, newTeamId, effectiveDate, reason } = body;

    if (!employeeId || !effectiveDate) {
      return NextResponse.json({ success: false, message: "Employee and Effective Date are required" }, { status: 400 });
    }

    // Get current employee details
    const employee = await prisma.user.findUnique({
      where: { id: employeeId, vendorId: session.user.vendorId }
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    const transfer = await prisma.employeeTransfer.create({
      data: {
        vendorId: session.user.vendorId,
        employeeId,
        oldBranchId: employee.branchId,
        newBranchId: newBranchId || null,
        oldDepartmentId: employee.departmentId,
        newDepartmentId: newDepartmentId || null,
        oldTeamId: employee.teamId,
        newTeamId: newTeamId || null,
        effectiveDate: new Date(effectiveDate),
        reason,
        status: "PENDING",
        requestedById: session.user.id
      }
    });

    return NextResponse.json({ success: true, data: transfer });
  } catch (error: any) {
    console.error("Transfer create error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
