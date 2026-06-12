import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    const vendorId = params.id;

    if (action === "SUSPEND") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: "SUSPENDED" },
      });
      return NextResponse.json({ success: true, message: "Company Suspended" });
    }

    if (action === "ACTIVATE") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({ success: true, message: "Company Activated" });
    }

    if (action === "CONVERT_TO_PAID") {
      await prisma.vendorSubscription.update({
        where: { vendorId },
        data: {
          status: "ACTIVE",
          trialEndsAt: null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year
        },
      });
      return NextResponse.json({ success: true, message: "Converted to Paid Subscription" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Lead Action Error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
