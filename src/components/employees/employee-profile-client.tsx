"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, Info, Building2, CalendarCheck, FileText, FolderKanban, History, 
  Mail, Phone, MapPin, Briefcase, Calendar, Clock, User, UserCircle, Link2
} from "lucide-react";
import { cn, getInitials, getAvatarColor, formatDate } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/shared";

export default function EmployeeProfileClient({ employeeId, userRole }: { employeeId: string, userRole: string }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ['employee-profile', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    }
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "leaves", label: "Leaves", icon: Calendar },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "history", label: "History", icon: History },
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
  if (error || !data) return <div className="text-center text-red-500 py-12">Failed to load employee profile</div>;

  const emp = data;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex items-center gap-5">
          {emp.profileImage ? (
            <img src={emp.profileImage} alt={emp.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg", getAvatarColor(emp.name))}>
              {getInitials(emp.name)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{emp.name}</h1>
            <p className="text-blue-200 mt-0.5">{emp.designation?.name || emp.role}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{emp.employeeId}</span>
              {emp.department && <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{emp.department.name}</span>}
              {emp.branch && <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{emp.branch.name}</span>}
              <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold",
                emp.isActive ? "bg-emerald-500/30 text-emerald-100" : "bg-red-500/30 text-red-100")}>
                {emp.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-6 text-center">
            {[
              { label: "Attendance", value: emp._count?.attendance || 0 },
              { label: "Leaves", value: emp._count?.leavesRequested || 0 },
              { label: "Projects", value: emp._count?.memberProjects || 0 },
              { label: "Tasks", value: emp._count?.assignedTasks || 0 },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-blue-200 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {activeTab === "overview" && <OverviewTab emp={emp} />}
        {activeTab === "organization" && <OrganizationTab emp={emp} />}
        {activeTab === "attendance" && <AttendanceTab attendance={emp.recentAttendance} />}
        {activeTab === "leaves" && <LeavesTab leaves={emp.recentLeaves} />}
        {activeTab === "projects" && <ProjectsTab projects={emp.projects} />}
        {activeTab === "history" && <HistoryTab emp={emp} />}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string, value: string | null | undefined, icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      {icon && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

function OverviewTab({ emp }: { emp: any }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <User size={15} className="text-primary" /> Personal Information
          </h3>
          <InfoRow label="Email" value={emp.email} icon={<Mail size={14} className="text-primary" />} />
          <InfoRow label="Phone" value={emp.phone} icon={<Phone size={14} className="text-blue-500" />} />
          <InfoRow label="Gender" value={emp.gender} icon={<UserCircle size={14} className="text-purple-500" />} />
          <InfoRow label="Date of Birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : null} icon={<Calendar size={14} className="text-amber-500" />} />
          <InfoRow label="Father's Name" value={emp.fathersName} icon={<User size={14} className="text-emerald-500" />} />
          <InfoRow label="Address" value={emp.address} icon={<MapPin size={14} className="text-red-500" />} />
          {emp.linkedInUrl && (
            <div className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Link2 size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">LinkedIn</p>
                <a href={emp.linkedInUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate block mt-0.5">
                  {emp.linkedInUrl}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Work Information */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase size={15} className="text-primary" /> Work Information
          </h3>
          <InfoRow label="Employee ID" value={emp.employeeId} icon={<UserCircle size={14} className="text-primary" />} />
          <InfoRow label="Role" value={emp.role} icon={<Briefcase size={14} className="text-blue-500" />} />
          <InfoRow label="Joining Date" value={emp.joinDate ? formatDate(emp.joinDate) : null} icon={<Calendar size={14} className="text-indigo-500" />} />
          <InfoRow label="Shift Timing" value={`${emp.shiftStart} – ${emp.shiftEnd}`} icon={<Clock size={14} className="text-orange-500" />} />
        </div>
      </div>
    </div>
  );
}

function OrganizationTab({ emp }: { emp: any }) {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold text-card-foreground">Organizational Assignment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "Branch", value: emp.branch?.name, icon: <MapPin size={16} className="text-red-500" /> },
          { label: "Department", value: emp.department?.name, icon: <Building2 size={16} className="text-purple-500" /> },
          { label: "Team", value: emp.team?.name, icon: <User size={16} className="text-emerald-500" /> },
          { label: "Designation", value: emp.designation?.name, extra: emp.designation?.level, icon: <Briefcase size={16} className="text-amber-500" /> },
          { label: "Reporting Manager", value: emp.reportingManager?.name, extra: emp.reportingManager?.employeeId, icon: <UserCircle size={16} className="text-cyan-500" /> },
        ].map(item => (
          <div key={item.label} className="p-4 bg-muted/30 border border-border rounded-lg flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{item.label}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{item.value || "—"}</p>
              {item.extra && <p className="text-xs text-muted-foreground mt-0.5">{item.extra}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Subordinates */}
      {emp.subordinates && emp.subordinates.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Direct Reports ({emp.subordinates.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emp.subordinates.map((sub: any) => (
              <div key={sub.id} className="flex items-center p-3 bg-background border border-border rounded-lg">
                {sub.profileImage ? (
                  <img src={sub.profileImage} alt={sub.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                ) : (
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3", getAvatarColor(sub.name))}>
                    {getInitials(sub.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{sub.name}</div>
                  <div className="text-xs text-muted-foreground">{sub.employeeId} {sub.designation?.name ? `• ${sub.designation.name}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceTab({ attendance }: { attendance: any[] }) {
  return (
    <div>
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-card-foreground">Recent Attendance (Last 30 Days)</h3>
      </div>
      {!attendance || attendance.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.map((a: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-foreground">{formatDate(a.date)}</td>
                  <td className="px-6 py-3 text-foreground">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"}</td>
                  <td className="px-6 py-3 text-foreground">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"}</td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                      a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      a.status === "LATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeavesTab({ leaves }: { leaves: any[] }) {
  return (
    <div>
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-card-foreground">Leave History</h3>
      </div>
      {!leaves || leaves.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No leave records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaves.map((l: any) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-foreground font-medium">{l.type}</td>
                  <td className="px-6 py-3 text-foreground">{formatDate(l.startDate)}</td>
                  <td className="px-6 py-3 text-foreground">{formatDate(l.endDate)}</td>
                  <td className="px-6 py-3 text-muted-foreground max-w-[200px] truncate">{l.reason || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                      l.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      l.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectsTab({ projects }: { projects: any[] }) {
  return (
    <div>
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-card-foreground">Assigned Projects</h3>
      </div>
      {!projects || projects.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No projects assigned.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-4">
          {projects.map((p: any) => (
            <div key={p.id} className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
              <div className="font-medium text-foreground">{p.name}</div>
              <span className={cn(
                "inline-flex mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                p.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                {p.status?.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ emp }: { emp: any }) {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-card-foreground">Employee Timeline</h3>
      <div className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Joined the organization</p>
            <p className="text-xs text-muted-foreground">{emp.joinDate ? formatDate(emp.joinDate) : "—"}</p>
          </div>
        </div>
        {emp.department && (
          <div className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Assigned to {emp.department.name}</p>
              <p className="text-xs text-muted-foreground">Department assignment</p>
            </div>
          </div>
        )}
        {emp.designation && (
          <div className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Designation: {emp.designation.name}</p>
              {emp.designation.level && <p className="text-xs text-muted-foreground">Level: {emp.designation.level}</p>}
            </div>
          </div>
        )}
        {emp.team && (
          <div className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Team: {emp.team.name}</p>
              <p className="text-xs text-muted-foreground">Current team assignment</p>
            </div>
          </div>
        )}
        {emp.reportingManager && (
          <div className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Reports to {emp.reportingManager.name}</p>
              <p className="text-xs text-muted-foreground">{emp.reportingManager.employeeId}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          Detailed transfer and promotion history will be available in a future update.
        </p>
      </div>
    </div>
  );
}
