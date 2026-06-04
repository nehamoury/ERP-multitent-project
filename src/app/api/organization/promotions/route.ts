import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const promotions = await prisma.promotionHistory.findMany({
      where: {
        vendorId: session.user.vendorId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        employee: { select: { id: true, name: true, employeeId: true, profileImage: true, designationId: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const uniqueDesigIds = new Set<string>();
    promotions.forEach((p: any) => {
      uniqueDesigIds.add(p.oldDesignationId);
      uniqueDesigIds.add(p.newDesignationId);
    });

    const designations = await prisma.designation.findMany({
      where: { id: { in: Array.from(uniqueDesigIds) } },
      select: { id: true, name: true }
    });

    const desigMap = new Map();
    designations.forEach((d: any) => desigMap.set(d.id, d.name));

    const enrichedPromotions = promotions.map((p: any) => ({
      ...p,
      oldDesignationName: desigMap.get(p.oldDesignationId) || "Unknown",
      newDesignationName: desigMap.get(p.newDesignationId) || "Unknown",
    }));

    return NextResponse.json({ success: true, data: enrichedPromotions });
  } catch (error: any) {
    console.error("Promotions fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, newDesignationId, newLevel, newSalary, effectiveDate, reason } = body;

    if (!employeeId || !newDesignationId || !effectiveDate) {
      return NextResponse.json({ success: false, message: "Employee, New Designation, and Effective Date are required" }, { status: 400 });
    }

    // Get current employee details
    const employee = await prisma.user.findUnique({
      where: { id: employeeId, vendorId: session.user.vendorId }
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }
    
    if (!employee.designationId) {
      return NextResponse.json({ success: false, message: "Employee does not have a current designation" }, { status: 400 });
    }

    // In a real app, oldSalary and oldLevel would be fetched from a compensation table. 
    // We will leave them null for now or prompt user for them.

    const promotion = await prisma.promotionHistory.create({
      data: {
        vendorId: session.user.vendorId,
        employeeId,
        oldDesignationId: employee.designationId,
        newDesignationId,
        newLevel: newLevel || null,
        newSalary: newSalary ? parseFloat(newSalary) : null,
        effectiveDate: new Date(effectiveDate),
        reason,
        status: "PENDING",
        requestedById: session.user.id
      }
    });

    return NextResponse.json({ success: true, data: promotion });
  } catch (error: any) {
    console.error("Promotion create error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
