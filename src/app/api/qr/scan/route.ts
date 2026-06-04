// src/app/api/qr/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { startOfDay, endOfDay, differenceInMinutes, format } from "date-fns";
import { isLateCheckIn, getLateMinutes, logAudit } from "@/lib/utils";
import { sendEmail, checkInEmailTemplate } from "@/lib/email";

// Verify the HMAC signature in the QR payload
function verifyPayload(payload: {
  userId: string;
  employeeId: string;
  nonce: string;
  ts: number;
  sig: string;
}): boolean {
  try {
    // Allow QR codes valid for 24 hours
    const age = Date.now() - payload.ts;
    if (age > 24 * 60 * 60 * 1000) return false;

    const secret = process.env.NEXTAUTH_SECRET || "default-secret";
    const raw = `${payload.userId}:${payload.employeeId}:${payload.nonce}:${payload.ts}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex")
      .slice(0, 16);
    return crypto.timingSafeEqual(
      Buffer.from(payload.sig, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { qrData, action } = body; // action: "auto" | "checkin" | "checkout"

    if (!qrData) return NextResponse.json({ error: "QR data is required" }, { status: 400 });

    let targetEmployeeId: string;

    if (session.user.role === "EMPLOYEE") {
      // Employee is scanning the Admin's generic QR
      if (typeof qrData === "string" && qrData.startsWith("attendiq-checkin-")) {
        // We could also check the timestamp to prevent old QR codes from being used
        const parts = qrData.split("-");
        const ts = parseInt(parts[2], 10);
        if (Date.now() - ts > 5 * 60 * 1000) { // 5 minutes expiry as a fallback
          return NextResponse.json({ error: "QR Code expired. Ask Admin to refresh." }, { status: 400 });
        }
        targetEmployeeId = session.user.id;
      } else {
        return NextResponse.json({ error: "Invalid Admin QR code" }, { status: 400 });
      }
    } else {
      // Admin/HR is scanning the Employee's personal QR
      let payload: any;
      try {
        payload = JSON.parse(qrData);
      } catch {
        return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 });
      }

      // Verify signature
      if (!verifyPayload(payload)) {
        return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 });
      }
      targetEmployeeId = payload.userId;
    }

    // Find the employee
    const employee = await prisma.user.findFirst({
      where: { id: targetEmployeeId, vendorId: session.user.vendorId },
      select: {
        id: true, employeeId: true, name: true, email: true,
        department: true, shiftStart: true, isActive: true,
      },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    if (!employee.isActive) return NextResponse.json({ error: "Employee account is inactive" }, { status: 400 });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Get existing record for today
    const existing = await prisma.attendance.findFirst({
      where: { userId: employee.id, vendorId: session.user.vendorId, date: { gte: todayStart, lte: todayEnd } },
    });

    const settings = await prisma.companySettings.findFirst({
      where: { vendorId: session.user.vendorId }
    });
    const shiftStart = settings?.workingHoursStart ?? "09:00";
    const threshold = settings?.lateThreshold ?? 15;

    let result: any = {};
    let actionDone = "";

    // Auto-detect: no record → check in, checked in but no checkout → check out
    const shouldCheckIn = action === "checkin" || (action === "auto" && !existing?.checkIn);
    const shouldCheckOut = action === "checkout" || (action === "auto" && existing?.checkIn && !existing?.checkOut);

    if (shouldCheckIn && !existing?.checkIn) {
      // ── CHECK IN ──
      const late = isLateCheckIn(now, shiftStart, threshold);
      const lateMin = getLateMinutes(now, shiftStart);

      const record = await prisma.attendance.upsert({
        where: { userId_date: { userId: employee.id, date: todayStart } },
        create: {
          userId: employee.id,
          vendorId: session.user.vendorId,
          date: todayStart,
          checkIn: now,
          status: late ? "LATE" : "PRESENT",
          isLate: late,
          lateMinutes: late ? lateMin : 0,
          ipAddress: `QR-SCAN by ${session.user.employeeId}`,
        },
        update: {
          checkIn: now,
          status: late ? "LATE" : "PRESENT",
          isLate: late,
          lateMinutes: late ? lateMin : 0,
        },
      });

      await Promise.all([
        prisma.activityLog.create({
          data: {
            userId: employee.id,
            vendorId: session.user.vendorId,
            action: "CHECKIN",
            description: `${employee.name} checked in via QR at ${format(now, "hh:mm a")} (scanned by ${session.user.name})`,
            metadata: { method: "QR", scannedBy: session.user.id, late, lateMinutes: lateMin },
          },
        }),
        logAudit(session.user.id, session.user.vendorId, "CHECKIN", "Attendance", record.id,
          `QR Check-in for ${employee.name} at ${format(now, "hh:mm a")}`),
        prisma.notification.create({
          data: {
            userId: employee.id,
            vendorId: session.user.vendorId,
            title: "QR Check-in Recorded",
            message: `You were checked in via QR at ${format(now, "hh:mm a")}${late ? " (Late)" : ""}`,
            type: late ? "warning" : "success",
          },
        }),
        sendEmail({
          to: employee.email,
          subject: "✅ QR Check-in Confirmed – AttendIQ",
          html: checkInEmailTemplate(employee.name, format(now, "hh:mm a"), format(now, "dd MMM yyyy")),
        }),
      ]);

      actionDone = "checkin";
      result = { record, late, lateMinutes: lateMin };

    } else if (shouldCheckOut && existing?.checkIn && !existing?.checkOut) {
      // ── CHECK OUT ──
      const workingMins = differenceInMinutes(now, existing.checkIn);
      const workingHours = parseFloat((workingMins / 60).toFixed(2));

      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkOut: now, workingHours },
      });

      await Promise.all([
        prisma.activityLog.create({
          data: {
            userId: employee.id,
            vendorId: session.user.vendorId,
            action: "CHECKOUT",
            description: `${employee.name} checked out via QR at ${format(now, "hh:mm a")} – worked ${workingHours}h (scanned by ${session.user.name})`,
            metadata: { method: "QR", scannedBy: session.user.id, workingHours },
          },
        }),
        logAudit(session.user.id, session.user.vendorId, "CHECKOUT", "Attendance", record.id,
          `QR Check-out for ${employee.name} at ${format(now, "hh:mm a")}, ${workingHours}h`),
        prisma.notification.create({
          data: {
            userId: employee.id,
            vendorId: session.user.vendorId,
            title: "QR Check-out Recorded",
            message: `You were checked out via QR at ${format(now, "hh:mm a")}. Worked ${workingHours.toFixed(1)}h`,
            type: "info",
          },
        }),
      ]);

      actionDone = "checkout";
      result = { record, workingHours };

    } else if (existing?.checkIn && existing?.checkOut) {
      return NextResponse.json({
        error: "Already completed for today",
        employee: { name: employee.name, employeeId: employee.employeeId },
        checkIn: existing.checkIn,
        checkOut: existing.checkOut,
        workingHours: existing.workingHours,
      }, { status: 400 });
    } else {
      return NextResponse.json({
        error: "No valid action – already checked in or nothing to do",
        employee: { name: employee.name, employeeId: employee.employeeId },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action: actionDone,
      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
      },
      time: now.toISOString(),
      ...result,
    });

  } catch (error) {
    console.error("QR scan error:", error);
    return NextResponse.json({ error: "QR scan failed. Please try again." }, { status: 500 });
  }
}
