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
    const { status } = body; // APPROVED, REJECTED, CANCELLED

    if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const transferId = params.id;

    // Run within a transaction to update transfer, employee, and insert history
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.employeeTransfer.findUnique({
        where: { id: transferId, vendorId: session.user.vendorId },
        include: { employee: true }
      });

      if (!transfer) {
        throw new Error("Transfer request not found");
      }

      if (transfer.status !== "PENDING") {
        throw new Error(`Transfer is already ${transfer.status}`);
      }

      // Update transfer status
      const updatedTransfer = await tx.employeeTransfer.update({
        where: { id: transferId },
        data: {
          status,
          approvedById: session.user.id
        }
      });

      // If approved, update the employee record and create a history entry
      if (status === "APPROVED") {
        const updateData: any = {};
        if (transfer.newBranchId !== null) updateData.branchId = transfer.newBranchId;
        if (transfer.newDepartmentId !== null) updateData.departmentId = transfer.newDepartmentId;
        if (transfer.newTeamId !== null) updateData.teamId = transfer.newTeamId;

        if (Object.keys(updateData).length > 0) {
          await tx.user.update({
            where: { id: transfer.employeeId },
            data: updateData
          });
        }

        // Add to Employee History
        await tx.employeeHistory.create({
          data: {
            vendorId: session.user.vendorId,
            employeeId: transfer.employeeId,
            action: "Transferred",
            details: {
              oldBranchId: transfer.oldBranchId,
              newBranchId: transfer.newBranchId,
              oldDepartmentId: transfer.oldDepartmentId,
              newDepartmentId: transfer.newDepartmentId,
              oldTeamId: transfer.oldTeamId,
              newTeamId: transfer.newTeamId,
              effectiveDate: transfer.effectiveDate,
              reason: transfer.reason,
            }
          }
        });
      }

      return updatedTransfer;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Transfer update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
