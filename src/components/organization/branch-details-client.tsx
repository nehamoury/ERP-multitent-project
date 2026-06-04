"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Building2, FolderKanban, Phone, Mail, User, Network } from "lucide-react";
import Link from "next/link";

export default function BranchDetailsClient({ initialData }: { initialData: any }) {
  const { data: branch } = useQuery({
    queryKey: ['branch', initialData.id],
    queryFn: async () => {
      const res = await fetch(`/api/organization/branches/${initialData.id}`);
      const json = await res.json();
      return json.data;
    },
    initialData,
  });

  return (
    <div className="space-y-6">
      {/* Branch Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Employees</p>
            <h3 className="text-2xl font-bold text-foreground">{branch._count?.users || 0}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Departments</p>
            <h3 className="text-2xl font-bold text-foreground">{branch._count?.departments || 0}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><Network size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Teams</p>
            <h3 className="text-2xl font-bold text-foreground">{branch._count?.teams || 0}</h3>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><FolderKanban size={24} /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Projects</p>
            <h3 className="text-2xl font-bold text-foreground">{branch._count?.projects || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-card-foreground">Branch Information</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {branch.address ? `${branch.address}, ` : ''}
                    {branch.city ? `${branch.city}, ` : ''}
                    {branch.state ? `${branch.state}, ` : ''}
                    {branch.country || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Manager</p>
                  <p className="text-sm text-muted-foreground">{branch.manager?.name || "Not Assigned"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-muted-foreground" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Contact</p>
                  <p className="text-sm text-muted-foreground">{branch.contactNumber || "N/A"}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border mt-4">
                <p className="text-xs text-muted-foreground">
                  Status: <span className={`font-medium ${branch.isActive ? 'text-green-500' : 'text-red-500'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Departments & Teams */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="font-semibold text-card-foreground">Departments</h3>
              <Link href="/admin/organization/departments" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="p-0">
              {branch.departments && branch.departments.length > 0 ? (
                <div className="divide-y divide-border">
                  {branch.departments.map((dept: any) => (
                    <div key={dept.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="font-medium text-sm text-foreground">{dept.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                        <Users size={12} /> {dept._count?.users || 0} members
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No departments assigned to this branch.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="font-semibold text-card-foreground">Teams</h3>
              <Link href="/admin/organization/teams" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="p-0">
              {branch.teams && branch.teams.length > 0 ? (
                <div className="divide-y divide-border">
                  {branch.teams.map((team: any) => (
                    <div key={team.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="font-medium text-sm text-foreground">{team.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                        <Users size={12} /> {team._count?.users || 0} members
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No teams assigned to this branch.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
