import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        subscription: { include: { plan: true } }
      }
    });

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.status === "ACTIVE").length;
    const trialVendors = vendors.filter(v => v.subscription?.status === "TRIAL").length;
    const expiredVendors = vendors.filter(v => v.subscription?.status === "EXPIRED").length;

    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions
    let mrr = 0;
    vendors.forEach(v => {
      if (v.subscription && (v.subscription.status === "ACTIVE" || v.subscription.status === "TRIAL")) {
        // Assume trial might convert, or only count ACTIVE
        // For SaaS metrics, typically only ACTIVE counts towards MRR
        if (v.subscription.status === "ACTIVE") {
          mrr += v.subscription.plan.priceMonthly;
        }
      }
    });

    const arr = mrr * 12;

    const totalEmployees = await prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } });
    const activeUsers = await prisma.user.count({ where: { isActive: true, role: { not: "SUPER_ADMIN" } } });

    // Recent vendors for a small table
    const recentVendors = vendors
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        name: v.name,
        plan: v.subscription?.plan?.name || "None",
        status: v.status,
        createdAt: v.createdAt
      }));

    return NextResponse.json({
      metrics: {
        totalVendors,
        activeVendors,
        trialVendors,
        expiredVendors,
        mrr,
        arr,
        totalEmployees,
        activeUsers
      },
      recentVendors
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
