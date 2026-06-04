// src/app/api/attendance/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { format } from "date-fns";
import { logAudit } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const today = startOfDay(now);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        date: { gte: today, lte: endOfDay(now) },
      },
    });

    if (!existing) return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
    if (existing.checkOut) return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
    if (!existing.checkIn) return NextResponse.json({ error: "Must check in first" }, { status: 400 });

    const workingMins = differenceInMinutes(now, existing.checkIn);
    const workingHours = parseFloat((workingMins / 60).toFixed(2));

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: now, workingHours },
    });

    await Promise.all([
      prisma.activityLog.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          action: "CHECKOUT",
          description: `${session.user.name} checked out at ${format(now, "hh:mm a")}. Total: ${workingHours.toFixed(1)}h`,
          metadata: { checkIn: now.toISOString(), workingHours },
        },
      }),
      logAudit(session.user.id, session.user.vendorId, "CHECKOUT", "Attendance", record.id, `Check-out at ${format(now, "hh:mm a")}, worked ${workingHours}h`),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          vendorId: session.user.vendorId,
          title: "Check-out Recorded",
          message: `You checked out at ${format(now, "hh:mm a")}. Working hours: ${workingHours.toFixed(1)}h`,
          type: "info",
        },
      }),
    ]);

    return NextResponse.json({ success: true, record, workingHours });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Check-out failed" }, { status: 500 });
  }
}
