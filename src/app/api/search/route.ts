import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    
    if (q.length < 2) {
       return NextResponse.json({ 
         employees: [], departments: [], teams: [], projects: [], attendance: [], leaves: [] 
       });
    }

    const vendorId = session.user.vendorId;

    // Concurrently search across different models for better performance
    const [employees, departments, teams, projects, attendance, leaves] = await Promise.all([
      prisma.user.findMany({
        where: {
          vendorId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { department: { name: { contains: q, mode: "insensitive" } } },
            { designation: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
        take: 5,
      }),
      prisma.department.findMany({
        where: {
          vendorId,
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, head: { select: { name: true } } },
        take: 3,
      }),
      prisma.team.findMany({
        where: {
          vendorId,
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, department: { select: { name: true } } },
        take: 3,
      }),
      prisma.project.findMany({
        where: {
          vendorId,
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, status: true },
        take: 3,
      }),
      prisma.attendance.findMany({
        where: {
          vendorId,
          user: { name: { contains: q, mode: "insensitive" } },
        },
        select: { id: true, date: true, status: true, user: { select: { name: true } } },
        take: 3,
      }),
      prisma.leave.findMany({
        where: {
          vendorId,
          OR: [
            { reason: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } }
          ],
        },
        select: { id: true, type: true, status: true, user: { select: { name: true } } },
        take: 3,
      })
    ]);

    return NextResponse.json({
      employees,
      departments,
      teams,
      projects,
      attendance,
      leaves
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
