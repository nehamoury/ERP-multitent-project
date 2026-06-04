"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, RefreshCw, ChevronLeft, ChevronRight, X, Loader2,
  CheckCircle, Clock, AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui/shared";
import { useSession } from "next-auth/react";

interface WorkReport {
  id: string;
  userId: string;
  date: string;
  description: string;
  hoursWorked: number;
  status: string;
  reviewNote: string | null;
  user: { id: string; name: string; employeeId: string; department: string | null };
  reviewer: { id: string; name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function WorkReportsClient({ isAdmin, isHR }: { isAdmin?: boolean; isHR?: boolean }) {
  const { data: session } = useSession();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], description: "", hoursWorked: "" });

  // Review modal
  const [reviewTarget, setReviewTarget] = useState<WorkReport | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const canReview = isAdmin || isHR;
  const isEmployee = !canReview;

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/work-reports?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("Failed to load work reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/work-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessMsg("Work report submitted!");
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], description: "", hoursWorked: "" });
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: string) => {
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/work-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessMsg(`Report ${status.toLowerCase()}!`);
      setReviewTarget(null);
      setReviewNote("");
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelCls = "text-xs font-medium text-muted-foreground block mb-1";

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

      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={fetchReports} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
        {isEmployee && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Submit Report
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">{total} reports</div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Employee", "Date", "Description", "Hours", "Status", "Reviewer", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                </td></tr>
              )}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No work reports found</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{r.user.name}</span>
                      <p className="text-xs text-muted-foreground">{r.user.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3 font-semibold">{r.hoursWorked}h</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", STATUS_COLORS[r.status])}>
                      {r.status === "SUBMITTED" && <Clock size={11} />}
                      {r.status === "APPROVED" && <CheckCircle size={11} />}
                      {r.status === "REJECTED" && <AlertCircle size={11} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.reviewer?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {canReview && r.status === "SUBMITTED" && (
                      <button onClick={() => setReviewTarget(r)}
                        className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">Submit Work Report</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date*</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Hours Worked*</label>
                  <input type="number" required min="0.5" max="24" step="0.5" value={form.hoursWorked}
                    onChange={e => setForm(p => ({ ...p, hoursWorked: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description*</label>
                <textarea required rows={4} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What did you work on today?"
                  className="w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 justify-center">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : "Submit Report"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Review Report</h3>
              <button onClick={() => setReviewTarget(null)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{reviewTarget.user.name}</span></p>
              <p><span className="text-muted-foreground">Date:</span> {formatDate(reviewTarget.date)}</p>
              <p><span className="text-muted-foreground">Hours:</span> {reviewTarget.hoursWorked}h</p>
              <div>
                <p className="text-muted-foreground mb-1">Description:</p>
                <p className="bg-muted rounded-lg p-3">{reviewTarget.description}</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Review Note</label>
              <textarea rows={3} value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Optional review comments…"
                className="w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleReview(reviewTarget.id, "APPROVED")} disabled={reviewSubmitting} className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700">
                {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
              </Button>
              <Button onClick={() => handleReview(reviewTarget.id, "REJECTED")} disabled={reviewSubmitting} className="flex-1 justify-center bg-red-600 hover:bg-red-700">
                {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />} Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
