// src/components/leaves/leaves-client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Plus, X, Loader2, Check, XCircle } from "lucide-react";
import { cn, getStatusColor, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/shared";

interface Leave {
  id: string; type: string; status: string;
  startDate: string; endDate: string; totalDays: number;
  reason: string; rejectionNote: string | null; createdAt: string;
  user?: { id: string; name: string; employeeId: string; department: any };
  approver?: { id: string; name: string } | null;
}

interface Props { isAdmin?: boolean; }

const LEAVE_TYPES = ["ANNUAL","SICK","CASUAL","MATERNITY","PATERNITY","EMERGENCY","UNPAID"];

export default function LeavesClient({ isAdmin }: Props) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    type: "ANNUAL",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/leaves?${params}`);
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch { }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Leave request submitted!");
      setShowModal(false);
      fetchLeaves();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleAction = async (leaveId: string, action: "approve" | "reject") => {
    setActionLoading(leaveId + action);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Leave ${action}d successfully`);
      fetchLeaves();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      {(error || success) && (
        <div className={cn("p-3 rounded-lg text-sm flex items-center justify-between",
          success ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200 dark:border-red-800"
        )}>
          {error || success}
          <button onClick={() => { setError(""); setSuccess(""); }}><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Statuses</option>
          {["PENDING","APPROVED","REJECTED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {!isAdmin && (
          <Button onClick={() => setShowModal(true)} className="ml-auto">
            <Plus size={16} /> Request Leave
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {[isAdmin ? "Employee" : null, "Type", "From", "To", "Days", "Status", "Reason", isAdmin ? "Actions" : null]
                  .filter(Boolean).map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={8} className="py-16 text-center"><Loader2 size={24} className="animate-spin mx-auto text-primary" /></td></tr>}
              {!loading && leaves.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No leave requests found</td></tr>
              )}
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-muted/30 transition-colors">
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{leave.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{leave.user?.department?.name ?? ""}</p>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {leave.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(parseISO(leave.startDate), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(parseISO(leave.endDate), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{leave.totalDays}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", getStatusColor(leave.status))}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{leave.reason}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {leave.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(leave.id, "approve")}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === leave.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, "reject")}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === leave.id + "reject" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </div>
                      )}
                      {leave.approver && leave.status !== "PENDING" && (
                        <span className="text-xs text-muted-foreground">by {leave.approver.name}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg">{error}</div>}
              <div>
                <label className="text-sm font-medium block mb-1.5">Leave Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} required
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required
                    className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required
                    className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required rows={3}
                  placeholder="Briefly describe the reason…"
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1 justify-center">
                  {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : "Submit Request"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
