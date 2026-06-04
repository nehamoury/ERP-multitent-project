"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, X, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/shared";

const RESOURCES = [
  { key: "employees", label: "Employees" },
  { key: "attendance", label: "Attendance" },
  { key: "leaves", label: "Leaves" },
  { key: "notices", label: "Notices" },
  { key: "projects", label: "Projects" },
  { key: "payroll", label: "Payroll" },
  { key: "invoices", label: "Invoices" },
  { key: "work_reports", label: "Work Reports" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

const ROLES = ["ADMIN", "HR", "EMPLOYEE"];

interface Permission {
  id: string;
  role: string;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function PermissionsClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      setPermissions(data.permissions || []);
    } catch {
      setError("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const getPerm = (role: string, resource: string) => {
    return permissions.find(p => p.role === role && p.resource === resource);
  };

  const togglePerm = async (role: string, resource: string, field: string) => {
    const existing = getPerm(role, resource);
    const updates = {
      canCreate: existing?.canCreate || false,
      canRead: existing?.canRead || false,
      canUpdate: existing?.canUpdate || false,
      canDelete: existing?.canDelete || false,
    };
    (updates as any)[field] = !(updates as any)[field];

    setSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, resource, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchPermissions();
      setSuccess("Permission updated!");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Failed to update permission");
    } finally {
      setSaving(false);
    }
  };

  const cols = ["Create", "Read", "Update", "Delete"];

  return (
    <div className="space-y-4">
      {(error || success) && (
        <div className={cn("p-3 rounded-lg text-sm flex items-center justify-between",
          success ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        )}>
          {error || success}
          <button onClick={() => { setError(""); setSuccess(""); }}><X size={14} /></button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={fetchPermissions} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
        {saving && <span className="text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin inline" /> Saving…</span>}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
                {cols.map(c => (
                  <th key={c} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                </td></tr>
              ) : (
                ROLES.map(role =>
                  RESOURCES.map(res => {
                    const perm = getPerm(role, res.key);
                    return (
                      <tr key={`${role}-${res.key}`} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{role}</td>
                        <td className="px-4 py-3 text-muted-foreground">{res.label}</td>
                        {["canCreate", "canRead", "canUpdate", "canDelete"].map(f => {
                          const checked = perm ? (perm as any)[f] : (f === "canRead");
                          return (
                            <td key={f} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(role, res.key, f)}
                                disabled={f === "canRead" && role === "ADMIN"}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
