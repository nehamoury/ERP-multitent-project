import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await req.json();
    const { planId, companyDetails } = body;
    const { companyName, adminEmail } = companyDetails;

    if (!planId || !companyName || !adminEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the plan
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Amount in paise
    const amountInPaise = Math.round(plan.priceMonthly * 100);

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // Create CheckoutSession
    const session = await prisma.checkoutSession.create({
      data: {
        vendorName: companyName,
        email: adminEmail,
        planId: plan.id,
        amount: plan.priceMonthly,
        razorpayOrderId: order.id,
        status: "PENDING",
        companyDetails: companyDetails as any,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: plan.priceMonthly,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
