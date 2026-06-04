import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "mocksecret",
  });

  try {
    const { planId, isYearly } = await req.json();

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const vendor = await prisma.vendor.findUnique({
      where: { id: session.user.vendorId },
      include: { subscription: true }
    });
    
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Base price
    const baseAmount = isYearly ? plan.priceYearly : plan.priceMonthly;
    if (baseAmount === 0) {
      return NextResponse.json({ error: "Cannot create order for free plan" }, { status: 400 });
    }

    // GST Calculation (18%)
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;

    // Razorpay amount is in paise (Multiply by 100)
    const amountInPaise = totalAmount * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`, // Reduced length to fit Razorpay 40-char limit
      notes: {
        vendorId: vendor.id,
        planId: plan.id,
        planName: plan.name,
        isYearly: isYearly ? "true" : "false",
        baseAmount: baseAmount.toString(),
        gstAmount: gstAmount.toString(),
      },
    };

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey";
    
    let order;
    if (keyId === "rzp_test_mockkey") {
      // Mock the order response for development without actual keys
      order = {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR"
      };
    } else {
      order = await razorpay.orders.create(options);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      vendorDetails: {
        name: vendor.name,
        email: session.user.email,
        phone: "",
      }
    });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
