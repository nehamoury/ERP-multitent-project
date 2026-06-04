"use client";

import { Users, Briefcase } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function TeamDashboardClient({ team }: { team: any }) {
  const stats = [
    { label: "Total Employees", value: team.users.length, icon: Users, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm col-span-1 md:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team Lead</h3>
            {team.lead ? (
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold", getAvatarColor(team.lead.name))}>
                  {getInitials(team.lead.name)}
                </div>
                <div>
                  <div className="text-lg font-bold">{team.lead.name}</div>
                  <div className="text-sm text-muted-foreground">{team.lead.employeeId} · {team.lead.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Users size={16} />
                </div>
                <span>No Team Lead assigned</span>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Employees List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              Team Members
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            {team.users.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
                <Users size={32} className="mb-2 opacity-20" />
                <p>No employees in this team.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", getAvatarColor(user.name))}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-[10px] text-muted-foreground">{user.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.designation?.name || "—"}
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
