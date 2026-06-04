"use client";

import { useState } from "react";
import { Users, Info, Building2, UserCircle2, ArrowUpRight } from "lucide-react";

export default function DesignationDashboardClient({ designation }: { designation: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "members", label: "Members", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-card-foreground">Designation Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                  <div className="mt-1 font-medium text-foreground">{designation.name}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</label>
                  <div className="mt-1 font-medium text-foreground">
                    {designation.level ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-secondary text-secondary-foreground border border-border">
                        {designation.level}
                      </span>
                    ) : "—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                  <div className="mt-1 font-medium text-foreground flex items-center gap-2">
                    <Building2 size={16} className="text-muted-foreground" />
                    {designation.department?.name || "—"}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                  <div className="mt-1 text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border min-h-[100px]">
                    {designation.description || <span className="text-muted-foreground italic">No description provided.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-6">
              <h4 className="text-sm font-semibold text-card-foreground mb-4">Quick Stats</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 border border-border rounded-lg">
                  <div className="text-muted-foreground text-sm font-medium mb-1">Total Employees</div>
                  <div className="text-2xl font-bold text-foreground">{designation.users?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="font-semibold text-card-foreground">Employees with this Designation</h3>
            </div>
            
            <div className="divide-y divide-border">
              {!designation.users || designation.users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No active employees have this designation.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-4">
                  {designation.users.map((user: any) => (
                    <div key={user.id} className="flex items-center p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border mr-3" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3 border border-primary/20">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
                          <span>{user.employeeId}</span>
                          {user.team?.name && (
                            <>
                              <span>•</span>
                              <span>{user.team.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
