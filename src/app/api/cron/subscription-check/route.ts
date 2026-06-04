import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This should be secured via a CRON_SECRET header in production
export async function GET(req: NextRequest) {
  try {
    // 1. Process Auto-Expiry
    const now = new Date();
    
    // Find subscriptions that ended before now and are still ACTIVE or TRIAL
    const expiredSubscriptions = await prisma.vendorSubscription.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIAL"] },
        OR: [
          { currentPeriodEnd: { lt: now }, status: "ACTIVE" },
          { trialEndsAt: { lt: now }, status: "TRIAL" }
        ],
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
      await prisma.$transaction([
        prisma.vendorSubscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" }
        }),
        // Optionally, do we suspend the vendor entirely? 
        // Or just let Read-Only middleware do its job. Leaving vendor ACTIVE so they can login.
        ...sub.vendor.users.map(u => 
          prisma.notification.create({
            data: {
              vendorId: sub.vendorId,
              userId: u.id,
              title: "Subscription Expired",
              message: "Your subscription has expired. The portal is now in Read-Only mode. Please upgrade to restore full access.",
              type: "warning"
            }
          })
        )
      ]);
    }

    // 2. Process Warnings (7, 3, 1 Days Before)
    const warnings = [
      { days: 7, label: "in 7 days" },
      { days: 3, label: "in 3 days" },
      { days: 1, label: "tomorrow" }
    ];

    for (const warning of warnings) {
      const targetDateStart = new Date(now);
      targetDateStart.setDate(now.getDate() + warning.days);
      targetDateStart.setHours(0, 0, 0, 0);

      const targetDateEnd = new Date(targetDateStart);
      targetDateEnd.setHours(23, 59, 59, 999);

      const expiringSoon = await prisma.vendorSubscription.findMany({
        where: {
          status: { in: ["ACTIVE", "TRIAL"] },
          OR: [
            { currentPeriodEnd: { gte: targetDateStart, lte: targetDateEnd }, status: "ACTIVE" },
            { trialEndsAt: { gte: targetDateStart, lte: targetDateEnd }, status: "TRIAL" }
          ]
        },
        include: { vendor: { include: { users: { where: { role: "ADMIN" } } } } }
      });

      for (const sub of expiringSoon) {
        for (const u of sub.vendor.users) {
          // Check if warning already sent today to prevent duplicates
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          
          const alreadyWarned = await prisma.notification.findFirst({
            where: {
              userId: u.id,
              title: "Subscription Expiring Soon",
              createdAt: { gte: todayStart }
            }
          });

          if (!alreadyWarned) {
            await prisma.notification.create({
              data: {
                vendorId: sub.vendorId,
                userId: u.id,
                title: "Subscription Expiring Soon",
                message: `Your subscription expires ${warning.label}. Please renew to avoid service disruption.`,
                type: "warning"
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      expiredProcessed: expiredSubscriptions.length 
    });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Failed to process cron job" }, { status: 500 });
  }
}
