// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/utils";
import { syncDepartmentChatMembers, syncTeamChatMembers } from "@/lib/chat-sync";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // All authenticated users can view the employee directory

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const dept = searchParams.get("dept") || "";
  const role = searchParams.get("role") || "";
  const branchId = searchParams.get("branchId") || "";
  const teamId = searchParams.get("teamId") || "";
  const designationId = searchParams.get("designationId") || "";
  const isActive = searchParams.get("isActive");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = { vendorId: session.user.vendorId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (dept) where.department = { name: dept };
    if (branchId) where.branchId = branchId;
    if (teamId) where.teamId = teamId;
    if (designationId) where.designationId = designationId;
    if (role) where.role = role;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === "true";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, employeeId: true, name: true, email: true,
          role: true, 
          branch: { select: { name: true } },
          department: { select: { name: true } }, 
          designation: { select: { name: true } },
          team: { select: { name: true } },
          reportingManager: { select: { name: true } },
          phone: true, isActive: true, joinDate: true,
          shiftStart: true, shiftEnd: true, createdAt: true,
          fathersName: true, address: true, linkedInUrl: true, dateOfBirth: true, gender: true,
          _count: { select: { attendance: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET Employees Error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, email, password, role, branchId, departmentId, teamId, designationId, reportingManagerId, managerId, phone, joinDate, shiftStart, shiftEnd, fathersName, address, linkedInUrl, dateOfBirth, gender } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const count = await prisma.user.count({ where: { vendorId: session.user.vendorId } });
    const maxEmployees = (session.user as any).subscription?.maxEmployees || 10;
    const planName = (session.user as any).subscription?.planName || "FREE";
    if (count >= maxEmployees) {
      return NextResponse.json({ 
        error: `Employee limit reached for your plan (${maxEmployees}). Please upgrade.`,
        code: "LIMIT_REACHED",
        planName,
        limit: maxEmployees,
        used: count
      }, { status: 403 });
    }

    const employeeId = `EMP${String(count + 1).padStart(3, "0")}`;

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        vendorId: session.user.vendorId,
        employeeId, name, email, password: hashed,
        role: role || "EMPLOYEE",
        branchId: branchId || null,
        departmentId: departmentId || null,
        teamId: teamId || null,
        designationId: designationId || null,
        reportingManagerId: reportingManagerId || managerId || null,
        phone,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        shiftStart: shiftStart || "09:00",
        shiftEnd: shiftEnd || "18:00",
        fathersName: fathersName || null,
        address: address || null,
        linkedInUrl: linkedInUrl || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
      },
      select: { id: true, employeeId: true, name: true, email: true, role: true },
    });

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "User", user.id, `Created employee ${name}`);

    const newCount = count + 1;
    const prevPercent = Math.floor((count / maxEmployees) * 100);
    const newPercent = Math.floor((newCount / maxEmployees) * 100);

    // Fire notification when crossing 80%, 90%, or 100% threshold
    const crossedThreshold = [80, 90, 100].find(t => prevPercent < t && newPercent >= t);
    if (crossedThreshold) {
      const isAtLimit = crossedThreshold === 100;
      await prisma.notification.create({
        data: {
          vendorId: session.user.vendorId,
          userId: session.user.id,
          title: isAtLimit ? "Employee Limit Reached" : "Plan Limit Warning",
          message: isAtLimit
            ? `You have reached your employee limit (${newCount}/${maxEmployees}). Please upgrade your plan to add more employees.`
            : `You have used ${crossedThreshold}% of your employee limit (${newCount}/${maxEmployees}). Consider upgrading your plan.`,
          type: "warning",
        },
      }).catch((err) => console.error("[POST /api/employees] Notification error:", err));
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("POST Employee Error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      id, isActive,
      branchId, departmentId, teamId, designationId, managerId, reportingManagerId,
      dateOfBirth,
      name, role, phone, shiftStart, shiftEnd, fathersName, address, linkedInUrl, gender,
    } = body;

    if (!id) return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });

    // Verify the employee belongs to this vendor first
    const existing = await prisma.user.findFirst({
      where: { id, vendorId: session.user.vendorId },
      select: { id: true, name: true, departmentId: true, teamId: true },
    });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Convert empty strings to null for relation fields to avoid FK errors
    const toNull = (v: string | undefined | null) => (v && v.trim() !== "" ? v : null);

    const updatePayload: any = {};

    if (name !== undefined) updatePayload.name = name;
    if (role !== undefined) updatePayload.role = role;
    if (phone !== undefined) updatePayload.phone = phone || null;
    if (shiftStart !== undefined) updatePayload.shiftStart = shiftStart;
    if (shiftEnd !== undefined) updatePayload.shiftEnd = shiftEnd;
    if (fathersName !== undefined) updatePayload.fathersName = fathersName || null;
    if (address !== undefined) updatePayload.address = address || null;
    if (linkedInUrl !== undefined) updatePayload.linkedInUrl = linkedInUrl || null;
    if (gender !== undefined) updatePayload.gender = gender || null;
    if (dateOfBirth !== undefined) updatePayload.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;

    // Relation fields — use null if empty
    if (branchId !== undefined) updatePayload.branchId = toNull(branchId);
    if (departmentId !== undefined) updatePayload.departmentId = toNull(departmentId);
    if (teamId !== undefined) updatePayload.teamId = toNull(teamId);
    if (designationId !== undefined) updatePayload.designationId = toNull(designationId);
    // managerId from form maps to reportingManagerId in schema
    const rmId = reportingManagerId ?? managerId;
    if (rmId !== undefined) updatePayload.reportingManagerId = toNull(rmId);

    const user = await prisma.user.update({
      where: { id },
      data: updatePayload,
    });

    // Sync Department Chat Members if department changed
    if (departmentId !== undefined) {
      const oldDeptId = existing.departmentId;
      const newDeptId = updatePayload.departmentId;
      if (oldDeptId !== newDeptId) {
        if (oldDeptId) await syncDepartmentChatMembers(oldDeptId, session.user.vendorId);
        if (newDeptId) await syncDepartmentChatMembers(newDeptId, session.user.vendorId);
      }
    }

    // Sync Team Chat Members if team changed
    if (teamId !== undefined) {
      const oldTeamId = existing.teamId;
      const newTeamId = updatePayload.teamId;
      if (oldTeamId !== newTeamId) {
        if (oldTeamId) await syncTeamChatMembers(oldTeamId, session.user.vendorId);
        if (newTeamId) await syncTeamChatMembers(newTeamId, session.user.vendorId);
      }
    }

    await logAudit(session.user.id, session.user.vendorId, "UPDATE", "User", id, `Updated employee ${user.name}`);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("PATCH Employee Error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update employee: " + error.message }, { status: 500 });
  }
}
