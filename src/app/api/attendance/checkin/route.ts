// src/app/api/attendance/checkin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { isLateCheckIn, getLateMinutes, logAudit } from "@/lib/utils";
import { sendEmail, checkInEmailTemplate } from "@/lib/email";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const today = startOfDay(now);

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        date: { gte: today, lte: endOfDay(now) },
      },
    });

    if (existing?.checkIn) {
      return NextResponse.json({ error: "Already checked in today", record: existing }, { status: 400 });
    }

    // Get company settings for shift time
    const settings = await prisma.companySettings.findFirst({
      where: { vendorId: session.user.vendorId }
    });
    const shiftStart = settings?.workingHoursStart ?? "09:00";
    const threshold = settings?.lateThreshold ?? 15;

    const late = isLateCheckIn(now, shiftStart, threshold);
    const lateMin = getLateMinutes(now, shiftStart);

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: session.user.id, date: today } },
      create: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        date: today,
        checkIn: now,
        status: late ? "LATE" : "PRESENT",
        isLate: late,
        lateMinutes: late ? lateMin : 0,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
      update: {
        checkIn: now,
        status: late ? "LATE" : "PRESENT",
        isLate: late,
        lateMinutes: late ? lateMin : 0,
      },
    });

    // Log activity and audit
    await Promise.all([
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          action: "CHECKIN",
          description: `${session.user.name} checked in at ${format(now, "hh:mm a")}`,
          metadata: { checkIn: now.toISOString(), late, lateMinutes: lateMin },
        },
      }),
      logAudit(session.user.id, session.user.vendorId, "CHECKIN", "Attendance", record.id, `Check-in recorded at ${format(now, "hh:mm a")}`),
      // Send email notification
      sendEmail({
        to: session.user.email,
        subject: "✅ Check-in Confirmed – AttendIQ",
        html: checkInEmailTemplate(session.user.name, format(now, "hh:mm a"), format(now, "dd MMM yyyy")),
      }),
      // Create notification
      prisma.notification.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          title: "Check-in Recorded",
          message: `You checked in at ${format(now, "hh:mm a")}${late ? " (Late)" : ""}`,
          type: late ? "warning" : "success",
        },
      }),
    ]);

    return NextResponse.json({ success: true, record, late });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
