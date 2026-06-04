import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const employee = await prisma.user.findFirst({
      where: { id: params.id, vendorId: session.user.vendorId },
      select: {
        id: true, employeeId: true, name: true, email: true,
        role: true, phone: true, isActive: true, joinDate: true,
        shiftStart: true, shiftEnd: true, createdAt: true, profileImage: true,
        fathersName: true, address: true, linkedInUrl: true, dateOfBirth: true, gender: true,
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true, level: true } },
        team: { select: { id: true, name: true } },
        reportingManager: { select: { id: true, name: true, employeeId: true, email: true } },
        subordinates: { 
          where: { isActive: true },
          select: { id: true, name: true, employeeId: true, profileImage: true, designation: { select: { name: true } } }
        },
        _count: {
          select: {
            attendance: true,
            leavesRequested: true,
            memberProjects: true,
            assignedTasks: true,
            workReports: true,
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Fetch recent attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendance = await prisma.attendance.findMany({
      where: { userId: params.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      take: 30,
      select: { date: true, checkIn: true, checkOut: true, status: true }
    });

    // Fetch recent leaves
    const recentLeaves = await prisma.leave.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, startDate: true, endDate: true, status: true, reason: true }
    });

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: { members: { some: { id: params.id } } },
      select: { id: true, name: true, status: true },
      take: 20,
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...employee,
        recentAttendance,
        recentLeaves,
        projects,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch employee details", errors: [error.message] }, { status: 500 });
  }
}
