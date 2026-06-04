// src/components/dashboard/admin-dashboard-client.tsx
"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatTime, timeAgo, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";

const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];

interface Props {
  trend: { date: string; count: number }[];
  deptData: { department: string | null; _count: { id: number } }[];
  recentActivity: any[];
  todayAttendance: any[];
}

const actionIcon: Record<string, string> = {
  LOGIN: "🔐", LOGOUT: "👋", CHECKIN: "✅", CHECKOUT: "🏁",
  CREATE: "➕", UPDATE: "✏️", DELETE: "🗑️", APPROVE: "✔️", REJECT: "✖️", EXPORT: "📥",
};

export default function AdminDashboardClient({ trend, deptData, recentActivity, todayAttendance }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trend Chart */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold">Monthly Attendance Trend</h3>
            <p className="text-sm text-muted-foreground">Daily check-in records</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              interval={4} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
              dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} name="Present" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dept Pie */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display font-semibold mb-1">By Department</h3>
        <p className="text-sm text-muted-foreground mb-4">Employee distribution</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={deptData.filter(d => d.department)} dataKey="_count.id" nameKey="department"
              cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
              {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [v, n]}
            />
            <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Today's Attendance */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h3 className="font-display font-semibold">Today's Check-ins</h3>
        </div>
        <div className="divide-y divide-border">
          {todayAttendance.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">No check-ins yet today</p>
          )}
          {todayAttendance.map((record) => (
            <div key={record.id} className="flex items-center gap-3 px-6 py-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {record.user?.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none text-foreground">{record.user?.name}</p>
                <p className="text-xs text-muted-foreground">{record.user?.department?.name ?? ""}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium tabular-nums">
                  {record.checkIn ? formatTime(record.checkIn) : "--"}
                </p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", getStatusColor(record.status))}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="font-display font-semibold">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-6 py-3">
              <span className="text-lg mt-0.5">{actionIcon[log.action] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{log.user?.name}</span>{" "}
                  <span className="text-muted-foreground">{log.description}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(log.createdAt)}</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground capitalize">
                {log.action.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
