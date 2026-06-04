import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const vendorId = session.user.vendorId;

    // Fetch subscription plans
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: "asc" },
    });

    // Fetch current subscription
    const currentSub = await prisma.vendorSubscription.findUnique({
      where: { vendorId },
      include: { plan: true },
    });

    // Fetch current employee count
    const employeeCount = await prisma.user.count({
      where: { vendorId },
    });

    return NextResponse.json({
      plans: allPlans,
      subscription: currentSub,
      usage: {
        employees: employeeCount,
        maxEmployees: currentSub?.plan?.maxEmployees || 5,
      },
    });
  } catch (error) {
    console.error("GET Billing Error:", error);
    return NextResponse.json({ error: "Failed to fetch billing info" }, { status: 500 });
  }
}
