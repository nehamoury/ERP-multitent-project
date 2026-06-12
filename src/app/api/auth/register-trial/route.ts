import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const limit = rateLimit(ip, 3, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { companyName, companyEmail, ownerName, mobileNumber, country, password } = body;

    if (!companyName || !companyEmail || !ownerName || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: companyEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // Check if vendor already exists (by email or name)
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existingVendor = await prisma.vendor.findUnique({
      where: { slug },
    });
    if (existingVendor) {
      return NextResponse.json({ error: "Company name is already taken" }, { status: 400 });
    }

    // Fetch or create a default "PRO" plan to attach the trial to
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: "PRO" },
    });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: "PRO",
          priceMonthly: 99,
          priceYearly: 999,
          maxEmployees: 100,
          maxBranches: 5,
          maxStorageMB: 5120,
          features: ["Payroll", "Invoices", "Work Reports", "Leave Management", "Projects", "QR Scanner", "Advanced Reports"],
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const currentPeriodEnd = new Date(trialEndsAt);

    // Atomic Transaction to create the Vendor and all defaults
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Vendor
      const vendor = await tx.vendor.create({
        data: {
          name: companyName,
          slug,
          email: companyEmail,
          phone: mobileNumber,
          status: "ACTIVE", // Trial is active
        },
      });

      // 2. Create Trial Subscription
      await tx.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: plan!.id,
          status: "TRIAL",
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      });

      // 3. Create Default Branch
      const branch = await tx.branch.create({
        data: {
          vendorId: vendor.id,
          name: "Headquarters",
          country,
        },
      });

      // 4. Create Default Department
      const department = await tx.department.create({
        data: {
          vendorId: vendor.id,
          name: "Management",
          branchId: branch.id,
        },
      });

      // 5. Create Default Team
      const team = await tx.team.create({
        data: {
          vendorId: vendor.id,
          name: "Core Team",
          departmentId: department.id,
        },
      });

      // 6. Create Admin User
      const adminUser = await tx.user.create({
        data: {
          vendorId: vendor.id,
          employeeId: "EMP-001",
          name: ownerName,
          email: companyEmail,
          password: hashedPassword,
          role: "ADMIN",
          phone: mobileNumber,
          branchId: branch.id,
          departmentId: department.id,
          teamId: team.id,
        },
      });

      // 7. Initialize Company Settings
      await tx.companySettings.create({
        data: {
          vendorId: vendor.id,
          companyName: companyName,
        },
      });

      return { vendor, adminUser };
    });

    return NextResponse.json({ success: true, vendorId: result.vendor.id }, { status: 201 });
  } catch (error: any) {
    console.error("Trial Registration Error:", error);
    return NextResponse.json({ error: "Failed to create trial account" }, { status: 500 });
  }
}
