"use client";

import { Building2, Layers, Network, Users, UserSquare2, TrendingUp, TrendingDown, ArrowRightLeft, Loader2, Activity } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface Props {
  data: {
    stats: {
      branches: number;
      departments: number;
      teams: number;
      designations: number;
      employees: number;
    };
    recentBranches: any[];
    recentDepartments: any[];
    recentTeams: any[];
    recentEmployees: any[];
    allDepartments: any[];
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#eab308'];

export default function OrganizationOverviewClient({ data }: Props) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['org-analytics'],
    queryFn: async () => {
      const res = await fetch("/api/organization/analytics");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    }
  });

  const baseStatsCards = [
    { title: "Total Branches", value: data.stats.branches, subtitle: "Locations", icon: Building2, color: "blue" as const },
    { title: "Total Departments", value: data.stats.departments, subtitle: "Business units", icon: Layers, color: "purple" as const },
    { title: "Total Teams", value: data.stats.teams, subtitle: "Operational teams", icon: Network, color: "green" as const },
    { title: "Total Designations", value: data.stats.designations, subtitle: "Job roles", icon: UserSquare2, color: "amber" as const },
  ];

  const distributionData = data.allDepartments.map(dept => ({
    name: dept.name,
    value: dept._count.users
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {baseStatsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12 bg-card rounded-xl border border-border">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatsCard title="Active Headcount" value={analytics.metrics.headcount} subtitle="Current employees" icon={Users} color="blue" />
            <StatsCard title="New Joiners" value={analytics.metrics.newJoiners} subtitle="This month" icon={TrendingUp} color="green" />
            <StatsCard title="Resigned" value={analytics.metrics.resignedEmployees} subtitle="Inactive employees" icon={TrendingDown} color="red" />
            <StatsCard title="Attrition Rate" value={analytics.metrics.attritionRate} subtitle="Overall turnover" icon={Activity} color="red" />
            <StatsCard title="Transfers" value={analytics.metrics.transfersThisMonth} subtitle="This month" icon={ArrowRightLeft} color="purple" />
            <StatsCard title="Promotions" value={analytics.metrics.promotionsThisMonth} subtitle="This month" icon={TrendingUp} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Distribution Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="text-primary w-5 h-5" />
                Employees by Department
              </h3>
              <div className="flex-1 min-h-[300px]">
                {distributionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))', 
                          backgroundColor: 'hsl(var(--card))', 
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }} 
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Employees by Branch Bar Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="text-primary w-5 h-5" />
                Employees by Branch
              </h3>
              <div className="flex-1 min-h-[300px]">
                {analytics.charts.employeesByBranch.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.charts.employeesByBranch} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.4)' }} 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))', 
                          backgroundColor: 'hsl(var(--card))', 
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Bar 
                        dataKey="employees" 
                        fill="#3b82f6" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={40} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Recents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Recent Employees</h3>
          {data.recentEmployees.length === 0 ? (
            <p className="text-xs text-muted-foreground">No employees added yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentEmployees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <div className="overflow-hidden">
                    <span className="font-medium text-sm block truncate">{emp.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{emp.department?.name || 'No Dept'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Recent Branches</h3>
          {data.recentBranches.length === 0 ? (
            <p className="text-xs text-muted-foreground">No branches added yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentBranches.map(branch => (
                <div key={branch.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">{branch.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Recent Departments</h3>
          {data.recentDepartments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No departments added yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentDepartments.map(dept => (
                <div key={dept.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm block truncate">{dept.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-white dark:bg-black px-1.5 py-0.5 rounded-full shadow-sm">{dept._count.users} Emp</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Recent Teams</h3>
          {data.recentTeams.length === 0 ? (
            <p className="text-xs text-muted-foreground">No teams added yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentTeams.map(team => (
                <div key={team.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <div className="overflow-hidden">
                    <span className="font-medium text-sm block truncate">{team.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{team.department?.name || 'No Dept'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
