import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";
import bcrypt from "bcryptjs";

function generatePassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();

    // 1. Auto-suspend expired free trials
    const expiredSubscriptions = await prisma.vendorSubscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: { lt: now },
        vendor: { status: { not: "SUSPENDED" } }
      },
      include: {
        vendor: {
          include: {
            users: {
              where: { role: "ADMIN" }
            }
          }
        }
      }
    });

    for (const sub of expiredSubscriptions) {
      try {
        await prisma.$transaction([
          prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED" }
          }),
          prisma.vendor.update({
            where: { id: sub.vendorId },
            data: { status: "SUSPENDED" }
          }),
          ...sub.vendor.users.map(u => 
            prisma.notification.create({
              data: {
                vendorId: sub.vendorId,
                userId: u.id,
                title: "Free Trial Expired",
                message: "Your free trial has expired. Please upgrade your subscription plan to restore access.",
                type: "WARNING"
              }
            })
          )
        ]);
      } catch (err) {
        console.error(`Failed to auto-suspend vendor ${sub.vendorId}:`, err);
      }
    }

    // 2. Warn about upcoming trial expirations (3 days before)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringSubscriptions = await prisma.vendorSubscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: {
          gt: now,
          lt: threeDaysFromNow
        }
      },
      include: {
        vendor: {
          include: {
            users: { where: { role: "ADMIN" } }
          }
        }
      }
    });

    for (const sub of expiringSubscriptions) {
      for (const u of sub.vendor.users) {
        try {
          const alreadyWarned = await prisma.notification.findFirst({
            where: {
              userId: u.id,
              title: "Free Trial Expiring Soon"
            }
          });
          if (!alreadyWarned) {
            await prisma.notification.create({
              data: {
                vendorId: sub.vendorId,
                userId: u.id,
                title: "Free Trial Expiring Soon",
                message: `Your free trial will expire on ${sub.trialEndsAt?.toLocaleDateString()}. Please upgrade your plan to avoid service disruption.`,
                type: "WARNING"
              }
            });
          }
        } catch (err) {
          console.error(`Failed to send warning notification to user ${u.id}:`, err);
        }
      }
    }

    // 3. Fetch all vendors
    const vendors = await prisma.vendor.findMany({
      include: {
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, email: true }
        },
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("GET /api/super-admin/vendors error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, slug, email, phone, status, planName, gstin, state, billingAddress } = body;

    if (!id || !name || !slug || !email) {
      return NextResponse.json({ error: "ID, name, slug, and email are required" }, { status: 400 });
    }

    const slugExists = await prisma.vendor.findFirst({
      where: { slug, id: { not: id } }
    });
    if (slugExists) {
      return NextResponse.json({ error: "Slug is already in use by another vendor" }, { status: 400 });
    }

    const selectedPlanName = (planName || "FREE").toUpperCase();
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: selectedPlanName as any }
    });
    if (!plan) {
      return NextResponse.json({ error: `Plan ${selectedPlanName} not found` }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Vendor details
      await tx.vendor.update({
        where: { id },
        data: {
          name,
          slug,
          email,
          phone,
          status,
          gstin: gstin || null,
          state: state || null,
          billingAddress: billingAddress || null,
        }
      });

      // 2. Update Subscription plan if mapped
      const sub = await tx.vendorSubscription.findUnique({
        where: { vendorId: id }
      });

      if (sub) {
        await tx.vendorSubscription.update({
          where: { id: sub.id },
          data: {
            planId: plan.id,
            status: status === "SUSPENDED" ? "CANCELLED" : (status === "ACTIVE" && sub.status === "EXPIRED" ? "ACTIVE" : sub.status)
          }
        });
      }
    });

    await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Vendor", id, `Super Admin updated vendor ${name}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/super-admin/vendors error:", error);
    return NextResponse.json({ error: "Failed to update vendor: " + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, email, phone, adminName, planName, gstin, state, billingAddress } = body;

    if (!name || !slug || !email || !adminName) {
      return NextResponse.json({ error: "Name, slug, email, and admin name are required" }, { status: 400 });
    }

    const exists = await prisma.vendor.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: "Vendor slug already exists" }, { status: 400 });
    }

    const emailExists = await prisma.vendor.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: "Vendor email already exists" }, { status: 400 });
    }

    // Resolve plan by name (fallback to FREE)
    const selectedPlanName = (planName || "FREE").toUpperCase();
    const selectedPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: selectedPlanName as any }
    });
    
    if (!selectedPlan) {
      return NextResponse.json({ error: `Plan ${selectedPlanName} not found in database` }, { status: 400 });
    }

    const rawPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Vendor
      const vendor = await tx.vendor.create({
        data: {
          name,
          slug,
          email,
          phone,
          gstin: gstin || null,
          state: state || null,
          billingAddress: billingAddress || null,
          status: "ACTIVE",
          companySettings: {
            create: {
              companyName: name,
            },
          },
        },
      });

      // 2. Assign Subscription
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      await tx.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: selectedPlan.id,
          status: "TRIAL",
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      });

      // 3. Default Branch & Department
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
          isActive: true,
          joinDate: new Date(),
        },
      });

      return { vendor, adminUser, rawPassword };
    });

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "Vendor", result.vendor.id, `Super Admin created vendor ${name}`);

    return NextResponse.json({ 
      success: true, 
      vendor: result.vendor,
      adminEmail: result.adminUser.email,
      adminPassword: result.rawPassword 
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/super-admin/vendors error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email or slug already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
