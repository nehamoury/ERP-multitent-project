// src/app/(dashboard)/employee/page.tsx
import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import EmployeeDashboardClient from "@/components/dashboard/employee-dashboard-client";

export const metadata: Metadata = { title: "My Dashboard | AttendIQ" };

async function getEmployeeData(userId: string, vendorId: string) {
  const today = new Date();
  const [todayRecord, monthRecords, user, pendingLeaves, recentNotices, payrollLatest] = await Promise.all([
    prisma.attendance.findFirst({
      where: { userId, date: { gte: startOfDay(today), lte: endOfDay(today) } },
    }),
    prisma.attendance.findMany({
      where: { userId, date: { gte: startOfMonth(today), lte: endOfMonth(today) } },
      orderBy: { date: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true, employeeId: true, email: true, phone: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
        branch: { select: { name: true } },
        shiftStart: true, shiftEnd: true, joinDate: true,
        reportingManager: { select: { name: true } },
      },
    }),
    prisma.leave.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, startDate: true, endDate: true, totalDays: true, status: true },
    }),
    prisma.notice.findMany({
      where: { vendorId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, type: true, createdAt: true, content: true },
    }),
    prisma.payroll.findFirst({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { month: true, year: true, netAmount: true, status: true, paidAt: true },
    }),
  ]);

  const workDaysInMonth = monthRecords.length;
  const presentCount = monthRecords.filter(r => r.status === "PRESENT" || r.status === "LATE" || r.status === "WORK_FROM_HOME").length;
  const absentCount = monthRecords.filter(r => r.status === "ABSENT").length;
  const lateCount = monthRecords.filter(r => r.status === "LATE").length;
  const totalHours = monthRecords.reduce((a, r) => a + (r.workingHours ?? 0), 0);
  const attendancePct = workDaysInMonth > 0 ? Math.round((presentCount / workDaysInMonth) * 100) : 0;

  return {
    user: user ? {
      ...user,
      department: user.department?.name || null,
      designation: user.designation?.name || null,
      branch: user.branch?.name || null,
      reportingManager: user.reportingManager?.name || null,
      joinDate: user.joinDate.toISOString(),
    } : null,
    todayRecord: todayRecord ? {
      ...todayRecord,
      date: todayRecord.date.toISOString(),
      checkIn: todayRecord.checkIn?.toISOString() ?? null,
      checkOut: todayRecord.checkOut?.toISOString() ?? null,
    } : null,
    stats: {
      presentCount, absentCount, lateCount,
      totalHours: parseFloat(totalHours.toFixed(1)),
      attendancePct,
      pendingLeavesCount: pendingLeaves.length,
      salaryStatus: payrollLatest?.status ?? null,
      lastSalary: payrollLatest ? {
        month: payrollLatest.month, year: payrollLatest.year,
        amount: payrollLatest.netAmount, status: payrollLatest.status
      } : null,
    },
    recentRecords: monthRecords.slice(0, 7).map(r => ({
      ...r,
      date: r.date.toISOString(),
      checkIn: r.checkIn?.toISOString() ?? null,
      checkOut: r.checkOut?.toISOString() ?? null,
    })),
    pendingLeaves: pendingLeaves.map(l => ({
      ...l,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
    })),
    recentNotices: recentNotices.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export default async function EmployeeDashboardPage() {
  const session = await getAuth();
  if (!session?.user) return null;
  const data = await getEmployeeData(session.user.id, session.user.vendorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Hello, <span className="text-primary">{session.user.name}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")} · {data.user?.employeeId} · {data.user?.department}
        </p>
      </div>
      <EmployeeDashboardClient
        todayRecord={data.todayRecord}
        stats={data.stats}
        recentRecords={data.recentRecords}
        pendingLeaves={data.pendingLeaves}
        recentNotices={data.recentNotices}
        user={data.user}
      />
    </div>
  );
}
