import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 6);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, adminName, email, phone, password } = body;

    if (!companyName || !adminName || !email || !password) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // Get FREE plan
    const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: "FREE" } });
    if (!freePlan) {
      return NextResponse.json({ error: "System misconfiguration: Free plan not found" }, { status: 500 });
    }

    const slug = generateSlug(companyName);
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaction to ensure all related data is created successfully
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Vendor
      const vendor = await tx.vendor.create({
        data: {
          name: companyName,
          slug,
          email,
          phone,
          status: "ACTIVE", // Or PENDING if you want email verification
          companySettings: {
            create: {
              companyName,
            },
          },
        },
      });

      // 2. Create Trial Subscription (14 Days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      await tx.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: freePlan.id,
          status: "TRIAL",
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      });

      // 3. Create Default Branch & Department
      const branch = await tx.branch.create({
        data: {
          vendorId: vendor.id,
          name: "Head Office",
          city: "HQ",
          isActive: true,
        },
      });

      const department = await tx.department.create({
        data: {
          vendorId: vendor.id,
          name: "Management",
          isActive: true,
        },
      });

      // 4. Create Admin User
      const adminUser = await tx.user.create({
        data: {
          vendorId: vendor.id,
          employeeId: "EMP001",
          name: adminName,
          email,
          phone,
          password: hashedPassword,
          role: "ADMIN",
          branchId: branch.id,
          departmentId: department.id,
          designationId: null, // Could create a default designation too
          isActive: true,
          joinDate: new Date(),
        },
      });

      // 5. Initial Audit Log
      await tx.auditLog.create({
        data: {
          vendorId: vendor.id,
          actorId: adminUser.id,
          action: "CREATE",
          entityType: "Vendor",
          entityId: vendor.id,
          description: `Company registered and Admin account created`,
        },
      });

      return { vendor, adminUser };
    });

    return NextResponse.json({ success: true, vendorId: result.vendor.id }, { status: 201 });
  } catch (error: any) {
    console.error("Registration Error:", error);
    // Handle Prisma unique constraint errors (e.g. email already exists in Vendor table)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to complete registration" }, { status: 500 });
  }
}
