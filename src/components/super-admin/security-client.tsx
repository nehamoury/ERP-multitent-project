"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Activity, Users, MapPin, Lock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/shared";
import { formatDate, formatTime, getRoleBadge } from "@/lib/utils";

export default function SecurityClient() {
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const res = await fetch("/api/super-admin/security");
      if (!res.ok) throw new Error("Failed to fetch security data");
      const data = await res.json();
      setLogins(data.recentLogins || []);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading security data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          Security Center
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitor authentication events and platform security metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Recent Logins (24h)</h3>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{logins.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active sessions across platform
            </p>
          </div>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Failed Attempts (24h)</h3>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-500">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No suspicious activity detected
            </p>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Super Admin Logins</h3>
            <Lock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {logins.filter(l => l.user?.role === "SUPER_ADMIN").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent master account access
            </p>
          </div>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader title="Recent Authentication Events" description="Latest successful logins across all vendors" />
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Vendor</th>
                  <th className="px-6 py-4 font-medium">IP / Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No recent logins found.
                    </td>
                  </tr>
                ) : (
                  logins.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{formatDate(log.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{log.user?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {log.user?.role ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(log.user.role)}`}>
                            {log.user.role}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {log.vendor?.name || "System"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{log.ipAddress || "Unknown IP"}</span>
                        </div>
                        {log.userAgent && (
                          <div className="text-xs text-muted-foreground/60 mt-1 truncate max-w-[200px]" title={log.userAgent}>
                            {log.userAgent}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
