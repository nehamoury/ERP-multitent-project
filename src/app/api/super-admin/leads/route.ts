import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status"); // ALL, TRIAL, PAID, EXPIRED
  const search = searchParams.get("search");

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "ACTIVE") where.status = "ACTIVE";
    if (statusFilter === "SUSPENDED") where.status = "SUSPENDED";
    // For Subscription logic:
    if (statusFilter === "TRIAL") where.subscription = { status: "TRIAL" };
    if (statusFilter === "PAID") where.subscription = { status: "ACTIVE" };
    if (statusFilter === "EXPIRED") where.subscription = { status: "EXPIRED" };
  }

  try {
    const leads = await prisma.vendor.findMany({
      where,
      include: {
        subscription: {
          include: { plan: true },
        },
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, phone: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedLeads = leads.map(vendor => ({
      id: vendor.id,
      companyName: vendor.name,
      email: vendor.email,
      phone: vendor.phone || vendor.users[0]?.phone,
      adminName: vendor.users[0]?.name,
      vendorStatus: vendor.status,
      subscriptionStatus: vendor.subscription?.status || "UNKNOWN",
      planName: vendor.subscription?.plan?.name || "None",
      trialStart: vendor.subscription?.currentPeriodStart,
      trialEnd: vendor.subscription?.trialEndsAt,
      createdAt: vendor.createdAt,
    }));

    return NextResponse.json({ success: true, leads: formattedLeads });
  } catch (error) {
    console.error("Fetch Leads Error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
