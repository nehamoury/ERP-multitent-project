import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  // Protect cron route (use a secret header in production)
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active trial subscriptions
    const trials = await prisma.vendorSubscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: { not: null },
      },
      include: {
        vendor: {
          include: { users: { where: { role: "ADMIN" } } },
        },
      },
    });

    let expiredCount = 0;
    let reminderCount = 0;

    for (const sub of trials) {
      if (!sub.trialEndsAt || !sub.currentPeriodStart) continue;

      const admin = sub.vendor.users[0];
      if (!admin) continue;

      const startDate = new Date(sub.currentPeriodStart);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(sub.trialEndsAt);
      endDate.setHours(0, 0, 0, 0);

      const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Day 14: Expire Trial
      if (daysLeft <= 0) {
        await prisma.vendorSubscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });

        await prisma.notification.create({
          data: {
            vendorId: sub.vendorId,
            userId: admin.id,
            title: "Free Trial Expired",
            message: "Your 14-day free trial has expired. Your account is now in Read-Only mode. Please upgrade to a paid plan to restore full access.",
            type: "error",
          },
        });
        expiredCount++;
      } 
      // Day 12: Upgrade Reminder (2 days left)
      else if (daysLeft === 2) {
        await prisma.notification.create({
          data: {
            vendorId: sub.vendorId,
            userId: admin.id,
            title: "Trial Expires in 48 Hours",
            message: "Your free trial is ending soon! Don't lose access to AttendIQ's premium features. Upgrade your plan today.",
            type: "warning",
          },
        });
        reminderCount++;
      }
      // Day 7: Midway Reminder
      else if (daysPassed === 7) {
        await prisma.notification.create({
          data: {
            vendorId: sub.vendorId,
            userId: admin.id,
            title: "How is your trial going?",
            message: "You are halfway through your free trial. Let us know if you need any help setting up your team!",
            type: "info",
          },
        });
        reminderCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: trials.length, 
      expired: expiredCount, 
      remindersSent: reminderCount 
    });

  } catch (error) {
    console.error("Trial Automation Error:", error);
    return NextResponse.json({ error: "Trial automation failed" }, { status: 500 });
  }
}
