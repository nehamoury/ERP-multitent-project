import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      notes // sent from client to retain metadata
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || "mocksecret";

    // Verify Signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    // We allow a mock bypass for development if the signature matches our bypass string, 
    // or if the actual signature matches.
    const isSignatureValid = generated_signature === razorpay_signature || razorpay_signature === "mock_signature_bypass";

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const { vendorId, planId, planName, isYearly, baseAmount, gstAmount } = notes;

    if (vendorId !== session.user.vendorId) {
      return NextResponse.json({ error: "Vendor mismatch" }, { status: 400 });
    }

    const totalAmount = parseFloat(baseAmount) + parseFloat(gstAmount);

    // 1. Record the Payment Transaction
    await prisma.paymentTransaction.create({
      data: {
        vendorId,
        amount: totalAmount,
        gateway: "RAZORPAY",
        transactionId: razorpay_payment_id,
        status: "SUCCESS"
      }
    });

    // 2. Generate a Billing Invoice
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    await prisma.billingInvoice.create({
      data: {
        vendorId,
        invoiceNumber,
        planName,
        amount: parseFloat(baseAmount),
        gstAmount: parseFloat(gstAmount),
        totalAmount,
        status: "PAID",
        paymentId: razorpay_payment_id,
      }
    });

    // 3. Update the Vendor Subscription
    const currentSub = await prisma.vendorSubscription.findUnique({ where: { vendorId } });
    
    let newPeriodStart = new Date();
    let newPeriodEnd = new Date();
    
    // If upgrading or renewing, extend the date.
    if (currentSub && currentSub.status === "ACTIVE" && new Date(currentSub.currentPeriodEnd) > new Date()) {
      newPeriodStart = new Date(currentSub.currentPeriodEnd);
      newPeriodEnd = new Date(currentSub.currentPeriodEnd);
    }

    if (isYearly === "true") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    await prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        planId,
        status: "ACTIVE",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
      },
      create: {
        vendorId,
        planId,
        status: "ACTIVE",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
      }
    });

    // 4. Log Subscription History
    await prisma.subscriptionHistory.create({
      data: {
        vendorId,
        newPlan: planName,
        oldPlan: currentSub?.planId || "FREE",
        amount: totalAmount,
        paymentStatus: "SUCCESS",
      }
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });

  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
