"use client";

import { Users, UsersRound, Building2, Briefcase } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DepartmentDashboardClient({ department }: { department: any }) {
  const stats = [
    { label: "Total Teams", value: department.teams.length, icon: UsersRound, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "Total Employees", value: department.users.length, icon: Users, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm col-span-1 md:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department Head</h3>
            {department.head ? (
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold", getAvatarColor(department.head.name))}>
                  {getInitials(department.head.name)}
                </div>
                <div>
                  <div className="text-lg font-bold">{department.head.name}</div>
                  <div className="text-sm text-muted-foreground">{department.head.employeeId} · {department.head.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users size={16} />
                </div>
                <span>No Department Head assigned</span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
                <div className={cn("p-2 rounded-lg mb-2", stat.bg, stat.color)}>
                  <stat.icon size={20} />
                </div>
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <UsersRound size={16} className="text-muted-foreground" />
              Teams in {department.name}
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {department.teams.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <Building2 size={32} className="mb-2 opacity-20" />
                <p>No teams created yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {department.teams.map((team: any) => (
                  <Link href={`/admin/organization/teams/${team.id}`} key={team.id} className="block group">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-semibold group-hover:text-primary transition-colors">{team.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Lead: {team.lead?.name || "Not assigned"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{team._count.users} members</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              Department Employees
            </h3>
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
            {department.users.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <Users size={32} className="mb-2 opacity-20" />
                <p>No employees in this department.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {department.users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", getAvatarColor(user.name))}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-[10px] text-muted-foreground">{user.designation?.name || user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.team?.name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
