import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlanName } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { priceMonthly: 'asc' }
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, priceMonthly, priceYearly, maxEmployees, features } = body;

    if (!name || priceMonthly === undefined || priceYearly === undefined || !maxEmployees) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const planNameEnum = name as PlanName;

    const plan = await prisma.subscriptionPlan.upsert({
      where: { name: planNameEnum },
      update: {
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        maxEmployees: parseInt(maxEmployees),
        features: features || [],
      },
      create: {
        name: planNameEnum,
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        maxEmployees: parseInt(maxEmployees),
        features: features || [],
      }
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/super-admin/plans error:", error);
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}
