import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // In a real application, we would aggregate `PaymentTransaction` and `BillingInvoice` tables.
    // For now, we will return some mock trend data along with real MRR for the charts.
    
    const vendors = await prisma.vendor.findMany({
      include: {
        subscription: { include: { plan: true } }
      }
    });

    let mrr = 0;
    vendors.forEach(v => {
      if (v.subscription && v.subscription.status === "ACTIVE") {
        mrr += v.subscription.plan.priceMonthly;
      }
    });

    const arr = mrr * 12;

    // Mock Chart Data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    
    const revenueTrend = months.slice(0, currentMonthIndex + 1).map((month, index) => ({
      name: month,
      revenue: Math.floor(mrr * (0.5 + (index / currentMonthIndex) * 0.5)) // Simulated growth
    }));

    const customerTrend = months.slice(0, currentMonthIndex + 1).map((month, index) => ({
      name: month,
      new: Math.floor(Math.random() * 10) + 2,
      churned: Math.floor(Math.random() * 3)
    }));

    return NextResponse.json({
      metrics: {
        todayRevenue: 0,
        thisMonthRevenue: mrr,
        pendingPayments: 0,
        failedPayments: 0,
        mrr,
        arr
      },
      charts: {
        revenueTrend,
        customerTrend
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
