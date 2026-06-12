// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO, setHours, setMinutes } from "date-fns";
import { logAudit } from "@/lib/utils";
import { getRoleScope } from "@/lib/scopes";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const scope = getRoleScope(session.user);
    const where: any = { vendorId: session.user.vendorId };

    if (scope.branchId) {
      where.user = { branchId: scope.branchId };
    }

    // Employees can only see their own records
    if (scope.id) {
      where.userId = scope.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (date) {
      const d = parseISO(date);
      where.date = { gte: startOfDay(d), lte: endOfDay(d) };
    } else if (month && year) {
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      where.date = { gte: startOfMonth(d), lte: endOfMonth(d) };
    }

    const [records, total, lateCount, checkedInCount] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { user: { select: { id: true, name: true, employeeId: true, department: true, designation: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.count({
        where: { ...where, isLate: true }
      }),
      prisma.attendance.count({
        where: { ...where, checkIn: { not: null } }
      })
    ]);

    return NextResponse.json({ records, total, page, limit, pages: Math.ceil(total / limit), lateCount, checkedInCount });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR", "BRANCH_MANAGER"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { employeeId, date, action, time, reason } = body;

    if (!employeeId || !date || !action || !time || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetDate = parseISO(date);
    const [hours, minutes] = time.split(":").map(Number);
    
    // Create the exact timestamp using the provided time
    const exactTimestamp = setMinutes(setHours(targetDate, hours), minutes);

    // Find if record exists for this date
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        vendorId: session.user.vendorId,
        userId: employeeId,
        date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
      }
    });

    let recordId = existingRecord?.id;

    if (action === "checkin") {
      // Calculate Late
      const [employee, settings] = await Promise.all([
        prisma.user.findUnique({ where: { id: employeeId }, select: { shiftStart: true } }),
        prisma.companySettings.findUnique({ where: { vendorId: session.user.vendorId }, select: { lateThreshold: true } })
      ]);
      
      const shiftStartStr = employee?.shiftStart || "09:00";
      const [shiftH, shiftM] = shiftStartStr.split(":").map(Number);
      const shiftStartMinutes = shiftH * 60 + shiftM;
      const actualMinutes = exactTimestamp.getHours() * 60 + exactTimestamp.getMinutes();
      
      let lateMinutes = actualMinutes - shiftStartMinutes;
      const threshold = settings?.lateThreshold ?? 15;
      
      let isLate = false;
      if (lateMinutes > threshold) {
        isLate = true;
      } else {
        isLate = false;
        lateMinutes = 0; // Not late, so record 0 or null.
      }

      if (existingRecord) {
        await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: { 
            checkIn: exactTimestamp, 
            status: "PRESENT", 
            note: reason,
            isLate,
            lateMinutes: lateMinutes > 0 ? lateMinutes : null
          }
        });
      } else {
        const newRecord = await prisma.attendance.create({
          data: {
            vendorId: session.user.vendorId,
            userId: employeeId,
            date: startOfDay(targetDate),
            checkIn: exactTimestamp,
            status: "PRESENT",
            note: reason,
            isLate,
            lateMinutes: lateMinutes > 0 ? lateMinutes : null
          }
        });
        recordId = newRecord.id;
      }
    } else if (action === "checkout") {
      if (!existingRecord) {
        return NextResponse.json({ error: "Cannot check out without a check-in record for this date." }, { status: 400 });
      }

      // Calculate working hours if checkIn exists
      let workingHours = existingRecord.workingHours;
      if (existingRecord.checkIn) {
        const diffMs = exactTimestamp.getTime() - existingRecord.checkIn.getTime();
        workingHours = Math.max(0, diffMs / (1000 * 60 * 60)); // in hours
      }

      await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: { checkOut: exactTimestamp, workingHours, note: reason }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log the manual override
    await logAudit(
      session.user.id,
      session.user.vendorId,
      "UPDATE",
      "Attendance",
      recordId || "unknown",
      `Manual Attendance Entry: ${action} at ${time} for user ${employeeId}. Reason: ${reason}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to create manual attendance record" }, { status: 500 });
  }
}

