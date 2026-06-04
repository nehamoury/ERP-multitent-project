import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const vendorId = session.user.vendorId;

    const invoices = await prisma.billingInvoice.findMany({
      where: { vendorId },
      orderBy: { invoiceDate: "desc" },
    });

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { billingAddress: true, state: true, gstin: true }
    });

    return NextResponse.json({ invoices, vendorSettings: vendor });
  } catch (error) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
