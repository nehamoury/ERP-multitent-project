import { Metadata } from "next";
import { Users, Clock, UserX, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns";
import { StatsCard } from "@/components/ui/stats-card";
import AdminDashboardClient from "@/components/dashboard/admin-dashboard-client";
import { getRoleScope } from "@/lib/scopes";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Branch Manager Dashboard" };

async function getDashboardData(sessionUser: any) {
  const scope = getRoleScope(sessionUser);
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Apply scope to users
  const userWhere: any = { isActive: true, vendorId: scope.vendorId, role: { notIn: ["ADMIN", "HR", "SUPER_ADMIN"] } };
  if (scope.branchId) userWhere.branchId = scope.branchId;

  // Apply scope to attendance and leaves
  const attendanceWhere: any = { vendorId: scope.vendorId, date: { gte: todayStart, lte: todayEnd } };
  if (scope.branchId) attendanceWhere.user = { branchId: scope.branchId };

  const monthAttendanceWhere: any = { vendorId: scope.vendorId, date: { gte: monthStart, lte: monthEnd } };
  if (scope.branchId) monthAttendanceWhere.user = { branchId: scope.branchId };

  const leaveWhere: any = { vendorId: scope.vendorId };
  if (scope.branchId) leaveWhere.user = { branchId: scope.branchId };

  const [
    totalEmployees,
    todayAttendance,
    leavesToday,
    monthlyAttendance,
    recentActivity,
    pendingLeaves,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.attendance.findMany({
      where: attendanceWhere,
      include: { user: { select: { id: true, name: true, employeeId: true, department: { select: { name: true } } } } },
    }),
    prisma.leave.count({ where: { ...leaveWhere, status: "APPROVED", startDate: { lte: todayEnd }, endDate: { gte: todayStart } } }),
    prisma.attendance.groupBy({
      by: ["date"],
      where: monthAttendanceWhere,
      _count: { id: true },
      orderBy: { date: "asc" },
    }),
    prisma.activityLog.findMany({
      where: { vendorId: scope.vendorId, ...(scope.branchId ? { user: { branchId: scope.branchId } } : {}) },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, role: true } } },
    }),
    prisma.leave.count({ where: { ...leaveWhere, status: "PENDING" } }),
  ]);

  const uniquePresentUsers = new Set(todayAttendance.filter(a => a.status === "PRESENT" || a.status === "LATE").map(a => a.userId));
  const presentToday = uniquePresentUsers.size;
  const lateToday = todayAttendance.filter(a => a.status === "LATE").length;
  const absentToday = Math.max(0, totalEmployees - presentToday - leavesToday);

  // 30-day trend
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(today, 29 - i);
    const dateStr = format(d, "MMM dd");
    const dayRecords = monthlyAttendance.find(m => format(new Date(m.date), "MMM dd") === dateStr);
    return { date: dateStr, count: dayRecords?._count.id ?? 0 };
  });

  // Dept breakdown
  const deptDataRaw = await prisma.user.groupBy({
    by: ["departmentId"],
    where: userWhere,
    _count: { id: true },
  });
  const deptIds = deptDataRaw.map(d => d.departmentId).filter(Boolean) as string[];
  const depts = await prisma.department.findMany({ where: { id: { in: deptIds } } });
  const deptData = deptDataRaw.map(d => ({
    department: depts.find(dept => dept.id === d.departmentId)?.name || null,
    _count: d._count
  }));

  return {
    stats: { totalEmployees, presentToday, lateToday, absentToday, leavesToday, pendingLeaves },
    trend,
    deptData,
    recentActivity: recentActivity.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    todayAttendance: todayAttendance.slice(0, 8).map(a => ({
      ...a,
      date: a.date.toISOString(),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
      user: {
        ...a.user,
        department: a.user?.department?.name || null
      }
    })),
  };
}

export default async function BranchManagerDashboardPage() {
  const session = await getAuth();
  if (!session?.user) return redirect("/login");
  
  if (session.user.role !== "BRANCH_MANAGER" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return redirect("/dashboard");
  }

  const data = await getDashboardData(session.user);

  const statsCards = [
    { title: "Branch Employees", value: data.stats.totalEmployees, subtitle: "Active staff", icon: Users, color: "blue" as const },
    { title: "Present Today", value: data.stats.presentToday, subtitle: `${Math.round((data.stats.presentToday / Math.max(data.stats.totalEmployees, 1)) * 100)}% attendance rate`, icon: Clock, color: "green" as const },
    { title: "Absent Today", value: data.stats.absentToday, subtitle: "Not checked in", icon: UserX, color: "red" as const },
    { title: "Late Arrivals", value: data.stats.lateToday, subtitle: "Arrived after shift", icon: AlertTriangle, color: "amber" as const },
    { title: "On Leave", value: data.stats.leavesToday, subtitle: "Approved leaves", icon: Activity, color: "purple" as const },
    { title: "Pending Leaves", value: data.stats.pendingLeaves, subtitle: "Awaiting approval", icon: TrendingUp, color: "blue" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          <span className="text-primary">{session?.user.name}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")} · Here's your branch overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts and Activity */}
      <AdminDashboardClient
        trend={data.trend}
        deptData={data.deptData}
        recentActivity={data.recentActivity}
        todayAttendance={data.todayAttendance}
      />
    </div>
  );
}
