"use client";

import { useState } from "react";
import { Users, Briefcase, MessageSquare, CheckSquare, Calendar, BarChart3, AlertCircle } from "lucide-react";
import { getAvatarColor, getInitials, cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

type TabType = "OVERVIEW" | "MEMBERS" | "PROJECTS" | "ATTENDANCE" | "TASKS" | "REPORTS";

export default function TeamDashboardClient({ team, chatRoomId }: { team: any, chatRoomId?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  const tabs = [
    { id: "OVERVIEW", label: "Overview", icon: BarChart3 },
    { id: "MEMBERS", label: "Members", icon: Users },
    { id: "PROJECTS", label: "Projects", icon: Briefcase },
    { id: "ATTENDANCE", label: "Attendance", icon: Calendar },
    { id: "TASKS", label: "Tasks", icon: CheckSquare },
    { id: "REPORTS", label: "Reports", icon: BarChart3 },
  ];

  // Placeholder data for attendance metrics
  const attendanceMetrics = {
    present: Math.round(team.users.length * 0.85),
    absent: Math.round(team.users.length * 0.1),
    late: Math.round(team.users.length * 0.05),
    percentage: "85%"
  };

  const isNearCapacity = team.maxMembers && team.users.length >= team.maxMembers * 0.8;
  const isAtCapacity = team.maxMembers && team.users.length >= team.maxMembers;

  return (
    <div className="space-y-6">
      {/* Team Header & Lead Info */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team Lead</h3>
          {team.lead ? (
            <div className="flex items-center gap-4">
              {team.lead.profileImage ? (
                <div className="w-14 h-14 rounded-full overflow-hidden relative">
                  <Image src={team.lead.profileImage} alt={team.lead.name} fill className="object-cover" />
                </div>
              ) : (
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold", getAvatarColor(team.lead.name))}>
                  {getInitials(team.lead.name)}
                </div>
              )}
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
          
          {chatRoomId && (
            <Link href={`/admin/messages?room=${chatRoomId}`} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium transition-colors text-sm">
              <MessageSquare size={16} />
              Open Team Chat
            </Link>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
            <span className="text-2xl font-bold">{team.users.length} {team.maxMembers && <span className="text-muted-foreground text-sm font-medium">/ {team.maxMembers}</span>}</span>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              Members 
              {isNearCapacity && !isAtCapacity && <span title="Near Capacity"><AlertCircle size={12} className="text-amber-500" /></span>}
              {isAtCapacity && <span title="At Capacity"><AlertCircle size={12} className="text-red-500" /></span>}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
            <span className="text-2xl font-bold">{team.projects?.length || 0}</span>
            <span className="text-xs font-medium text-muted-foreground">Projects</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto hide-scrollbar gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-card-foreground">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{team.description || "No description provided for this team."}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-card-foreground flex justify-between items-center">
                <span>Today's Attendance</span>
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">{attendanceMetrics.percentage}</span>
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceMetrics.present}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">Present</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{attendanceMetrics.absent}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">Absent</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{attendanceMetrics.late}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">Late</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "MEMBERS" && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold">Team Members ({team.users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {team.users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        No employees currently in this team.
                      </td>
                    </tr>
                  ) : (
                    team.users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", getAvatarColor(user.name))}>
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{user.role}</td>
                        <td className="px-6 py-4 text-muted-foreground">{user.designation?.name || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "PROJECTS" && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase size={16} className="text-muted-foreground" />
                Team Projects
              </h3>
            </div>
            <div className="p-4">
              {team.projects && team.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.projects.map((project: any) => (
                    <div key={project.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                      <h4 className="font-semibold">{project.name}</h4>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Status: {project.status}</span>
                        <span>Tasks: {project._count?.tasks || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
                  <Briefcase size={32} className="mb-2 opacity-20" />
                  <p>No projects assigned to this team.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === "ATTENDANCE" || activeTab === "TASKS" || activeTab === "REPORTS") && (
          <div className="bg-card border border-border rounded-xl p-12 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              {activeTab === "ATTENDANCE" && <Calendar size={32} />}
              {activeTab === "TASKS" && <CheckSquare size={32} />}
              {activeTab === "REPORTS" && <BarChart3 size={32} />}
            </div>
            <h3 className="text-xl font-bold mb-2">Integration Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The {activeTab.toLowerCase()} module integration is currently under development. Detailed metrics and tracking will appear here once the module is complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
