// src/app/api/leaves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { logAudit } from "@/lib/utils";
import { sendEmail, leaveApprovalTemplate } from "@/lib/email";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const features = (session.user as any).subscription?.features || [];
  if (!features.includes("Leave Management")) {
    return NextResponse.json({ error: "Leave Management is not available in your current plan. Please upgrade." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const userId = searchParams.get("userId") || "";

  try {
    const where: any = { vendorId: session.user.vendorId };
    if (session.user.role === "EMPLOYEE") where.userId = session.user.id;
    else if (userId) where.userId = userId;
    if (status) where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, employeeId: true, department: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const features = (session.user as any).subscription?.features || [];
  if (!features.includes("Leave Management")) {
    return NextResponse.json({ error: "Leave Management is not available in your current plan. Please upgrade." }, { status: 403 });
  }

  try {
    const { type, startDate, endDate, reason } = await req.json();
    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (start > end) return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

    const totalDays = differenceInCalendarDays(end, start) + 1;

    const leave = await prisma.leave.create({
      data: {
        vendorId: session.user.vendorId,
        userId: session.user.id,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: "PENDING",
      },
    });

    // Find all Admin and HR users in the same vendor to notify them
    const adminsAndHR = await prisma.user.findMany({
      where: {
        vendorId: session.user.vendorId,
        role: { in: ["ADMIN", "HR"] },
        isActive: true,
      },
      select: { id: true },
    });

    await Promise.all([
      logAudit(session.user.id, session.user.vendorId, "CREATE", "Leave", leave.id, `Leave request for ${type} (${totalDays} days)`),
      // Create notification for each Admin/HR user
      ...adminsAndHR.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            vendorId: session.user.vendorId,
            title: "New Leave Request",
            message: `${session.user.name} has applied for ${type} leave (${totalDays} day${totalDays > 1 ? "s" : ""}) — ${reason}`,
            type: "warning",
          },
        })
      ),
      // Also notify the employee that their request was submitted
      prisma.notification.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          title: "Leave Request Submitted",
          message: `Your ${type} leave request for ${totalDays} day${totalDays > 1 ? "s" : ""} has been submitted and is pending approval.`,
          type: "info",
        },
      }),
    ]);

    return NextResponse.json({ success: true, leave }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit leave" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const features = (session.user as any).subscription?.features || [];
  if (!features.includes("Leave Management")) {
    return NextResponse.json({ error: "Leave Management is not available in your current plan. Please upgrade." }, { status: 403 });
  }

  try {
    const { leaveId, action, rejectionNote } = await req.json();
    if (!leaveId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const status = action === "approve" ? "APPROVED" : "REJECTED";
    const leave = await prisma.leave.update({
      where: { id: leaveId, vendorId: session.user.vendorId },
      data: { status, approverId: session.user.id, rejectionNote: rejectionNote || null },
      include: { user: { select: { name: true, email: true } } },
    });

    await Promise.all([
      logAudit(session.user.id, session.user.vendorId, action === "approve" ? "APPROVE" : "REJECT", "Leave", leaveId, `Leave ${status.toLowerCase()} by ${session.user.name}`),
      sendEmail({
        to: leave.user.email,
        subject: `Leave ${status === "APPROVED" ? "Approved" : "Rejected"} – AttendIQ`,
        html: leaveApprovalTemplate(
          leave.user.name, status, leave.type,
          `${format(leave.startDate, "dd MMM")} - ${format(leave.endDate, "dd MMM yyyy")} (${leave.totalDays} days)`
        ),
      }),
    ]);

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 });
  }
}
