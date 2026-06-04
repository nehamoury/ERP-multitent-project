"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  LogIn, LogOut, Clock, TrendingUp, AlertTriangle, Check, Loader2, X,
  CalendarDays, UserCheck, Wallet, Bell, ChevronRight, Calendar
} from "lucide-react";
import { cn, getStatusColor, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  todayRecord: any;
  stats: {
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalHours: number;
    attendancePct: number;
    pendingLeavesCount: number;
    salaryStatus: string | null;
    lastSalary: { month: number; year: number; amount: number; status: string } | null;
  };
  recentRecords: any[];
  pendingLeaves: any[];
  recentNotices: any[];
  user: any;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const NOTICE_COLORS: Record<string, string> = {
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
  WARNING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  INFO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export default function EmployeeDashboardClient({
  todayRecord: initialRecord, stats, recentRecords, pendingLeaves, recentNotices, user
}: Props) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCheckIn = async () => {
    setLoading("in");
    try {
      const res = await fetch("/api/attendance/checkin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecord(data.record);
      showToast(`Checked in at ${formatTime(new Date())}${data.late ? " (Late)" : ""}`);
      router.refresh();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(null); }
  };

  const handleCheckOut = async () => {
    setLoading("out");
    try {
      const res = await fetch("/api/attendance/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecord((p: any) => ({ ...p, checkOut: new Date().toISOString(), workingHours: data.workingHours }));
      showToast(`Checked out. Worked ${data.workingHours.toFixed(1)} hours today!`);
      router.refresh();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(null); }
  };

  const hasCheckedIn = !!record?.checkIn;
  const hasCheckedOut = !!record?.checkOut;

  const salaryColor = stats.salaryStatus === "PAID"
    ? "text-emerald-500" : stats.salaryStatus === "PROCESSED"
    ? "text-blue-500" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Check In/Out Hero Card ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Today's Attendance</p>
            <p className="text-xl font-display font-bold">{format(new Date(), "EEEE, dd MMM yyyy")}</p>
            {user && (
              <p className="text-blue-200 text-sm mt-1">Shift: {user.shiftStart} – {user.shiftEnd}</p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex items-center gap-4">
              {record?.checkIn && (
                <div className="text-center">
                  <p className="text-xs text-blue-200">In</p>
                  <p className="font-bold tabular-nums text-lg">{formatTime(record.checkIn)}</p>
                </div>
              )}
              {record?.checkOut && (
                <div className="text-center">
                  <p className="text-xs text-blue-200">Out</p>
                  <p className="font-bold tabular-nums text-lg">{formatTime(record.checkOut)}</p>
                </div>
              )}
              {record?.workingHours && (
                <div className="text-center">
                  <p className="text-xs text-blue-200">Hours</p>
                  <p className="font-bold tabular-nums text-lg">{record.workingHours.toFixed(1)}h</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!hasCheckedIn && (
                <button onClick={handleCheckIn} disabled={!!loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-all disabled:opacity-60 shadow-md">
                  {loading === "in" ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  Check In
                </button>
              )}
              {hasCheckedIn && !hasCheckedOut && (
                <button onClick={handleCheckOut} disabled={!!loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all disabled:opacity-60 backdrop-blur-sm border border-white/20">
                  {loading === "out" ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  Check Out
                </button>
              )}
              {hasCheckedOut && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium border border-white/20">
                  <Check size={16} /> Day Complete ✓
                </div>
              )}
            </div>
          </div>
        </div>
        {record?.isLate && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-400/20 border border-amber-300/30 rounded-lg text-amber-200 text-sm">
            <AlertTriangle size={14} /> Late by {record.lateMinutes} minutes today
          </div>
        )}
      </div>

      {/* ── 6 Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Days Present", value: stats.presentCount,
            icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10",
            href: "/employee/attendance"
          },
          {
            label: "Days Absent", value: stats.absentCount,
            icon: X, color: "text-red-500", bg: "bg-red-500/10",
            href: "/employee/attendance"
          },
          {
            label: "Late Arrivals", value: stats.lateCount,
            icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10",
            href: "/employee/attendance"
          },
          {
            label: "Hours Worked", value: `${stats.totalHours}h`,
            icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10",
            href: "/employee/attendance"
          },
          {
            label: "Pending Leaves", value: stats.pendingLeavesCount,
            icon: CalendarDays, color: "text-purple-500", bg: "bg-purple-500/10",
            href: "/employee/leaves"
          },
          {
            label: "Payroll Status",
            value: stats.lastSalary
              ? `${MONTHS[stats.lastSalary.month - 1]}`
              : "N/A",
            sub: stats.lastSalary?.status ?? "—",
            icon: Wallet, color: salaryColor, bg: "bg-primary/10",
            href: "/employee/salary"
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
              <Icon size={16} className={color} />
            </div>
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            {sub && <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase mt-0.5">{sub}</div>}
          </Link>
        ))}
      </div>

      {/* ── Attendance % + Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Progress */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Monthly Attendance
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={`${stats.attendancePct * 2.51} 251`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{stats.attendancePct}%</span>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{stats.presentCount} Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{stats.absentCount} Absent</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Apply Leave", href: "/employee/leaves", icon: Calendar, color: "text-purple-500 bg-purple-500/10" },
              { label: "View Payroll", href: "/employee/salary", icon: Wallet, color: "text-blue-500 bg-blue-500/10" },
              { label: "My Profile", href: "/employee/profile", icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Holiday List", href: "/employee/holidays", icon: CalendarDays, color: "text-amber-500 bg-amber-500/10" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs", color)}>
                    <Icon size={14} />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CalendarDays size={16} className="text-purple-500" /> Pending Leaves
            </h3>
            <Link href="/employee/leaves" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold">{leave.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(leave.startDate), "dd MMM")} – {format(parseISO(leave.endDate), "dd MMM")}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                    {leave.totalDays}d · PENDING
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Records + Notices ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Attendance */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Clock size={16} className="text-primary" /> Recent Attendance</h3>
            <Link href="/employee/attendance" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-border">
            {recentRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No records this month</p>
            ) : recentRecords.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="text-xs font-medium w-24 text-muted-foreground flex-shrink-0">
                  {format(parseISO(r.date), "EEE, dd MMM")}
                </div>
                <div className="flex-1 flex items-center gap-3 text-xs">
                  <span className="tabular-nums">{r.checkIn ? formatTime(r.checkIn) : "—"}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="tabular-nums text-muted-foreground">{r.checkOut ? formatTime(r.checkOut) : "—"}</span>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0", getStatusColor(r.status))}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Bell size={16} className="text-primary" /> Company Notices</h3>
            <Link href="/employee/notices" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-border">
            {recentNotices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent notices</p>
            ) : recentNotices.map(notice => (
              <div key={notice.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border mt-0.5 flex-shrink-0",
                    NOTICE_COLORS[notice.type] || NOTICE_COLORS.INFO)}>
                    {notice.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{notice.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notice.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {format(parseISO(notice.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
