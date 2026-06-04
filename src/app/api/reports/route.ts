// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { logAudit } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const features = (session.user as any).subscription?.features || [];
  const hasReports = features.some((f: string) => f.includes("Reports"));
  if (!hasReports) {
    return NextResponse.json({ error: "Reports are not available in your current plan. Please upgrade." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "summary";
  const month = searchParams.get("month") || String(new Date().getMonth() + 1);
  const year = searchParams.get("year") || String(new Date().getFullYear());
  const exportType = searchParams.get("export") || "";
  const dept = searchParams.get("dept") || "";

  try {
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = startOfMonth(d);
    const endDate = endOfMonth(d);

    const where: any = { 
      vendorId: session.user.vendorId,
      date: { gte: startDate, lte: endDate } 
    };
    if (dept) where.user = { departmentId: dept, vendorId: session.user.vendorId };

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, employeeId: true, department: { select: { name: true } }, designation: { select: { name: true } }, email: true } } },
      orderBy: [{ user: { name: "asc" } }, { date: "asc" }],
    });

    // Summary stats
    const totalEmployees = await prisma.user.count({ 
      where: { 
        isActive: true, 
        vendorId: session.user.vendorId,
        ...(dept ? { departmentId: dept } : {}) 
      } 
    });
    const presentCount = records.filter((r: any) => r.status === "PRESENT").length;
    const lateCount = records.filter((r: any) => r.status === "LATE").length;
    const absentCount = records.filter((r: any) => r.status === "ABSENT").length;
    const avgHours = records.length ? records.reduce((a: any, r: any) => a + (r.workingHours ?? 0), 0) / records.length : 0;

    // CSV export
    if (exportType === "csv") {
      const rows = [
        ["Employee ID", "Name", "Department", "Date", "Check In", "Check Out", "Hours", "Status", "Late", "Late Minutes"],
        ...records.map((r: any) => [
          r.user.employeeId,
          r.user.name,
          r.user.department?.name ?? "",
          format(r.date, "yyyy-MM-dd"),
          r.checkIn ? format(r.checkIn, "HH:mm") : "",
          r.checkOut ? format(r.checkOut, "HH:mm") : "",
          r.workingHours?.toFixed(2) ?? "",
          r.status,
          r.isLate ? "Yes" : "No",
          r.lateMinutes ?? 0,
        ]),
      ];

      const csv = rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")).join("\n");
      await logAudit(session.user.id, session.user.vendorId, "EXPORT", "Attendance", "bulk", `Exported CSV for ${month}/${year}`);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-${year}-${month}.csv"`,
        },
      });
    }

    // Monthly trend
    const trend = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const dayRecords = records.filter((r: any) => new Date(r.date).getDate() === day);
      return {
        day,
        present: dayRecords.filter((r: any) => r.status === "PRESENT").length,
        late: dayRecords.filter((r: any) => r.status === "LATE").length,
        absent: totalEmployees - dayRecords.length,
      };
    }).filter((d: any) => d.day <= endDate.getDate());

    // Department breakdown
    const deptBreakdownRaw = await prisma.user.groupBy({
      by: ["departmentId"],
      where: { isActive: true, vendorId: session.user.vendorId },
      _count: { id: true },
    });
    const deptIds = deptBreakdownRaw.map((d: any) => d.departmentId).filter(Boolean) as string[];
    const depts = await prisma.department.findMany({ where: { id: { in: deptIds } } });
    const deptBreakdown = deptBreakdownRaw.map((d: any) => ({
      department: depts.find(dept => dept.id === d.departmentId)?.name || null,
      _count: d._count
    }));

    return NextResponse.json({
      summary: { totalEmployees, presentCount, lateCount, absentCount, avgHours: parseFloat(avgHours.toFixed(2)) },
      trend,
      deptBreakdown,
      records: exportType === "data" ? records : undefined,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
