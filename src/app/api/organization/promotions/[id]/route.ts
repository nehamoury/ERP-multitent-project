import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body; // APPROVED, REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const promotionId = params.id;

    // Run within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const promotion = await tx.promotionHistory.findUnique({
        where: { id: promotionId, vendorId: session.user.vendorId },
      });

      if (!promotion) {
        throw new Error("Promotion request not found");
      }

      if (promotion.status !== "PENDING") {
        throw new Error(`Promotion is already ${promotion.status}`);
      }

      // Update promotion status
      const updatedPromotion = await tx.promotionHistory.update({
        where: { id: promotionId },
        data: {
          status,
          approvedById: session.user.id
        }
      });

      // If approved, update the employee record and create a history entry
      if (status === "APPROVED") {
        await tx.user.update({
          where: { id: promotion.employeeId },
          data: {
            designationId: promotion.newDesignationId
          }
        });

        // Add to Employee History
        await tx.employeeHistory.create({
          data: {
            vendorId: session.user.vendorId,
            employeeId: promotion.employeeId,
            action: "Promoted",
            details: {
              oldDesignationId: promotion.oldDesignationId,
              newDesignationId: promotion.newDesignationId,
              newLevel: promotion.newLevel,
              newSalary: promotion.newSalary,
              effectiveDate: promotion.effectiveDate,
              reason: promotion.reason,
            }
          }
        });
      }

      return updatedPromotion;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Promotion update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
