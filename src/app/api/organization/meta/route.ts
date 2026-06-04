import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const vendorId = session.user.vendorId;

    const [branches, departments, teams, designations, managers] = await Promise.all([
      prisma.branch.findMany({ where: { vendorId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.department.findMany({ where: { vendorId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.team.findMany({ where: { vendorId }, select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
      prisma.designation.findMany({ where: { vendorId }, select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
      prisma.user.findMany({ 
        where: { vendorId, isActive: true }, 
        select: { id: true, name: true, role: true }, 
        orderBy: { name: 'asc' } 
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { branches, departments, teams, designations, managers }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch organization meta", errors: [error.message] }, { status: 500 });
  }
}
