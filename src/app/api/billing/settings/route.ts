import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { billingAddress, state, gstin } = await req.json();

    const updatedVendor = await prisma.vendor.update({
      where: { id: session.user.vendorId },
      data: {
        billingAddress,
        state,
        gstin,
      },
    });

    return NextResponse.json({ success: true, vendor: updatedVendor });
  } catch (error) {
    console.error("POST Billing Settings Error:", error);
    return NextResponse.json({ error: "Failed to update billing settings" }, { status: 500 });
  }
}
