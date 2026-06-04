import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: session.user.vendorId },
      select: { name: true }
    });

    const departments = await prisma.department.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      include: {
        head: {
          select: { id: true, name: true, employeeId: true }
        },
        teams: {
          orderBy: { name: 'asc' },
          include: {
            lead: {
              select: { id: true, name: true, employeeId: true }
            },
            users: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                employeeId: true,
                designation: { select: { name: true } },
                profileImage: true
              },
              orderBy: { name: 'asc' }
            }
          }
        },
        users: {
          where: { isActive: true, teamId: null }, // Users in department but NOT in any team
          select: {
            id: true,
            name: true,
            employeeId: true,
            designation: { select: { name: true } },
            profileImage: true
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    const hierarchy = {
      id: "company-root",
      name: vendor?.name || "Company",
      type: "COMPANY",
      children: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        type: "DEPARTMENT",
        head: dept.head,
        children: [
          ...dept.teams.map(team => ({
            id: team.id,
            name: team.name,
            type: "TEAM",
            lead: team.lead,
            children: team.users.map(user => ({
              id: user.id,
              name: user.name,
              type: "EMPLOYEE",
              employeeId: user.employeeId,
              designation: user.designation?.name,
              profileImage: user.profileImage
            }))
          })),
          ...dept.users.map(user => ({
            id: user.id,
            name: user.name,
            type: "EMPLOYEE",
            employeeId: user.employeeId,
            designation: user.designation?.name,
            profileImage: user.profileImage
          }))
        ]
      }))
    };

    return NextResponse.json({ success: true, message: "Hierarchy fetched successfully", data: hierarchy });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch hierarchy", errors: [error.message] }, { status: 500 });
  }
}
