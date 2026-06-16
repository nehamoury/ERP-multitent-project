import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { addYears, addMonths } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { vendorId, planName, billingCycle, amount, paymentMethod, referenceNo, notes } = data;

    if (!vendorId || !planName || !amount || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate Invoice Number
    const count = await prisma.billingInvoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

    // Get Subscription Plan ID
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.billingInvoice.create({
        data: {
          vendorId,
          invoiceNumber,
          planName: plan.name,
          amount: parseFloat(amount),
          gstAmount: 0, // Implement GST calculation if needed
          totalAmount: parseFloat(amount),
          status: "PAID",
          invoiceDate: new Date(),
        }
      });

      // 2. Create Payment Record
      await tx.paymentRecord.create({
        data: {
          invoiceId: invoice.id,
          vendorId,
          amount: parseFloat(amount),
          paymentMethod,
          paymentSource: "MANUAL",
          referenceNo: referenceNo || null,
          notes: notes || null,
          receivedBy: session.user.id,
        }
      });

      // 3. Activate or Renew Subscription
      let subscription = await tx.vendorSubscription.findUnique({
        where: { vendorId }
      });

      const now = new Date();
      let newStartDate = now;
      let newEndDate = billingCycle === "YEARLY" ? addYears(now, 1) : addMonths(now, 1);

      if (subscription && subscription.status === "ACTIVE" && subscription.currentPeriodEnd > now) {
        // Extend existing subscription
        newStartDate = subscription.currentPeriodStart;
        newEndDate = billingCycle === "YEARLY" 
          ? addYears(subscription.currentPeriodEnd, 1) 
          : addMonths(subscription.currentPeriodEnd, 1);
      }

      if (subscription) {
        await tx.vendorSubscription.update({
          where: { id: subscription.id },
          data: {
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: newStartDate,
            currentPeriodEnd: newEndDate,
          }
        });
      } else {
        // Fallback in case there is no subscription record yet
        subscription = await tx.vendorSubscription.create({
          data: {
            vendorId,
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: newStartDate,
            currentPeriodEnd: newEndDate,
          }
        });
      }

      // 4. Update Vendor Status
      await tx.vendor.update({
        where: { id: vendorId },
        data: { status: "ACTIVE" }
      });

      // 5. Create Audit Log
      await tx.billingAuditLog.create({
        data: {
          vendorId,
          action: "MANUAL_PAYMENT_RECORDED",
          description: `Admin ${session.user.name} recorded manual payment of ₹${amount} via ${paymentMethod} for ${planName} plan. Reference: ${referenceNo || 'N/A'}`,
          performedBy: session.user.id,
        }
      });

      return invoice;
    });

    return NextResponse.json({ success: true, invoice: transaction });

  } catch (error: any) {
    console.error("Manual Payment Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
