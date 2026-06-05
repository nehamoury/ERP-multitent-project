import { NextResponse } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow ADMIN and SUPER_ADMIN
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the vendor ID from the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { vendorId: true }
    });

    if (!user?.vendorId) {
      return NextResponse.json({ error: "No vendor associated" }, { status: 400 });
    }

    const data = await req.json();
    
    // Validate minimally required fields
    if (!data.companyName || !data.workingHoursStart || !data.workingHoursEnd || !data.workingDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Perform atomic transaction
    const [updatedVendor, updatedSettings] = await prisma.$transaction([
      // Update Vendor table
      prisma.vendor.update({
        where: { id: user.vendorId },
        data: { 
          name: data.companyName,
          email: data.companyEmail ?? undefined,
          phone: data.companyPhone ?? undefined,
          billingAddress: data.address ?? undefined,
          gstin: data.gstNumber ?? undefined,
          code: data.companyCode ?? undefined,
          website: data.website ?? undefined,
        },
      }),
      // Upsert CompanySettings
      prisma.companySettings.upsert({
        where: { vendorId: user.vendorId },
        create: {
          vendorId: user.vendorId,
          companyName: data.companyName,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd: data.workingHoursEnd,
          breakStart: data.breakStart ?? null,
          breakEnd: data.breakEnd ?? null,
          gracePeriod: parseInt(data.gracePeriod || "15", 10),
          lateThreshold: parseInt(data.lateThreshold || "15", 10),
          halfDayThreshold: parseInt(data.halfDayThreshold || "240", 10),
          absentThreshold: parseInt(data.absentThreshold || "480", 10),
          minimumWorkingHours: parseInt(data.minimumWorkingHours || "8", 10),
          overtimeEnabled: Boolean(data.overtimeEnabled),
          timezone: data.timezone,
          workingDays: data.workingDays,
          halfDaySupport: Boolean(data.halfDaySupport),
        },
        update: {
          companyName: data.companyName,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd: data.workingHoursEnd,
          breakStart: data.breakStart ?? null,
          breakEnd: data.breakEnd ?? null,
          gracePeriod: parseInt(data.gracePeriod || "15", 10),
          lateThreshold: parseInt(data.lateThreshold || "15", 10),
          halfDayThreshold: parseInt(data.halfDayThreshold || "240", 10),
          absentThreshold: parseInt(data.absentThreshold || "480", 10),
          minimumWorkingHours: parseInt(data.minimumWorkingHours || "8", 10),
          overtimeEnabled: Boolean(data.overtimeEnabled),
          timezone: data.timezone,
          workingDays: data.workingDays,
          halfDaySupport: Boolean(data.halfDaySupport),
        },
      })
    ]);

    return NextResponse.json({ vendor: updatedVendor, settings: updatedSettings });
  } catch (error) {
    console.error("[SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
