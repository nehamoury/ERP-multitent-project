import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID missing" }, { status: 400 });
    }

    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { plan: true },
    });

    if (!session || session.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
    }

    // Verify Signature if a real order ID is provided and we have a secret
    if (razorpay_order_id && razorpay_payment_id && process.env.RAZORPAY_KEY_SECRET) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    const details = session.companyDetails as any;
    const { companyName, industry, companySize, adminName, adminEmail, adminPhone, adminPassword, gstNumber, address, state } = details;

    // Use Prisma transaction to ensure atomic creation
    await prisma.$transaction(async (tx) => {
      // 1. Create Vendor
      const vendorSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
      const vendor = await tx.vendor.create({
        data: {
          name: companyName,
          slug: vendorSlug,
          email: adminEmail,
          phone: adminPhone || null,
          status: "ACTIVE",
          billingAddress: address || null,
          state: state || null,
          gstin: gstNumber || null,
          companySettings: {
            create: {
              companyName: companyName,
              timezone: "Asia/Kolkata",
            }
          }
        },
      });

      // 2. Create Branch
      const branch = await tx.branch.create({
        data: {
          vendorId: vendor.id,
          name: "Head Office",
          code: "HO",
          isActive: true,
        },
      });

      // 3. Create Department
      const department = await tx.department.create({
        data: {
          vendorId: vendor.id,
          branchId: branch.id,
          name: "Management",
          code: "MGT",
          isActive: true,
        },
      });

      // 4. Create Team
      const team = await tx.team.create({
        data: {
          vendorId: vendor.id,
          departmentId: department.id,
          branchId: branch.id,
          name: "Core Team",
          isActive: true,
        },
      });

      // 5. Create Admin User
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = await tx.user.create({
        data: {
          vendorId: vendor.id,
          employeeId: "EMP-001",
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          phone: adminPhone || null,
          branchId: branch.id,
          departmentId: department.id,
          teamId: team.id,
          isActive: true,
        },
      });

      // 6. Create Vendor Subscription
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      await tx.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: session.planId,
          status: "ACTIVE",
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

      // 7. Create Payment Transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          vendorId: vendor.id,
          amount: session.amount,
          gateway: "RAZORPAY",
          transactionId: razorpay_payment_id || `dummy_${Date.now()}`,
          status: "SUCCESS",
        },
      });

      // 8. Create Billing Invoice
      await tx.billingInvoice.create({
        data: {
          vendorId: vendor.id,
          invoiceNumber: `INV-${Date.now()}`,
          planName: session.plan.name,
          amount: session.amount,
          gstAmount: session.amount * 0.18, // example 18% GST calculation
          totalAmount: session.amount * 1.18,
          status: "PAID",
          paymentId: transaction.id,
        },
      });

      // 9. Update Checkout Session status
      await tx.checkoutSession.update({
        where: { id: sessionId },
        data: { status: "PAID" },
      });
    });

    return NextResponse.json({ success: true, message: "Onboarding successful. Please login." });
  } catch (error: any) {
    console.error("Register Paid Error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
