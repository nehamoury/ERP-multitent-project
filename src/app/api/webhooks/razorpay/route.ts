import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Common properties we might extract
    const payload = event.payload;
    const payment = payload?.payment?.entity;
    const subscription = payload?.subscription?.entity;

    switch (event.event) {
      case "payment.captured":
        // Handle successful payment
        if (payment && payment.notes?.vendorId) {
          await prisma.paymentTransaction.create({
            data: {
              vendorId: payment.notes.vendorId,
              amount: payment.amount / 100, // Razorpay amount is in paise
              gateway: "razorpay",
              status: "SUCCESS",
              transactionId: payment.id,
            },
          });
        }
        break;

      case "payment.failed":
        // Handle failed payment
        if (payment && payment.notes?.vendorId) {
          await prisma.paymentTransaction.create({
            data: {
              vendorId: payment.notes.vendorId,
              amount: payment.amount / 100,
              gateway: "razorpay",
              status: "FAILED",
              transactionId: payment.id,
            },
          });
        }
        break;

      case "subscription.charged":
        if (subscription && subscription.notes?.vendorId) {
          await prisma.vendorSubscription.update({
            where: { id: subscription.notes.subscriptionId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: new Date(subscription.current_start * 1000),
              currentPeriodEnd: new Date(subscription.current_end * 1000),
            },
          });
          // Note: In a real app, generate a billing invoice here
        }
        break;

      case "subscription.cancelled":
      case "subscription.paused":
      case "subscription.completed":
      case "subscription.resumed":
        if (subscription && subscription.notes?.vendorId) {
          const statusMap: Record<string, any> = {
            "subscription.cancelled": "CANCELLED",
            "subscription.paused": "PAST_DUE", // Assuming paused usually means past due or hold
            "subscription.completed": "EXPIRED",
            "subscription.resumed": "ACTIVE"
          };
          
          await prisma.vendorSubscription.update({
            where: { id: subscription.notes.subscriptionId },
            data: { status: statusMap[event.event] },
          });
        }
        break;

      default:
        console.log(`Unhandled Razorpay event type: ${event.event}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed", details: error.message }, { status: 500 });
  }
}
