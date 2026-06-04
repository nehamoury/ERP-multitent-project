"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, RefreshCw, ChevronLeft, ChevronRight, X, Loader2,
  Send, CheckCircle, Download
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui/shared";

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function InvoicesClient({ isAdmin, isHR }: { isAdmin?: boolean; isHR?: boolean }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    amount: "", gstAmount: "0", dueDate: "", notes: "",
  });

  const canManage = isAdmin || isHR;

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          gstAmount: parseFloat(form.gstAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessMsg("Invoice created successfully!");
      setShowModal(false);
      setForm({ clientName: "", clientEmail: "", clientPhone: "", amount: "", gstAmount: "0", dueDate: "", notes: "" });
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessMsg(`Invoice marked as ${status.toLowerCase()}!`);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      showSuccessMsg("Invoice deleted!");
      fetchInvoices();
    } catch {
      setError("Failed to delete invoice");
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
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by client or invoice number…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={fetchInvoices} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw size={16} className="text-muted-foreground" />
        </button>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Invoice
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">{total} invoices</div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Invoice #", "Client", "Amount", "GST", "Total", "Status", "Due Date", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                </td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No invoices found</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{inv.clientName}</span>
                      {inv.clientEmail && <p className="text-xs text-muted-foreground">{inv.clientEmail}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">₹{inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">₹{inv.gstAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", STATUS_COLORS[inv.status] || "")}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canManage && inv.status === "DRAFT" && (
                        <>
                          <button onClick={() => handleStatusUpdate(inv.id, "SENT")}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600 transition-colors" title="Mark Sent">
                            <Send size={14} />
                          </button>
                          <button onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                            <X size={14} />
                          </button>
                        </>
                      )}
                      {canManage && inv.status === "SENT" && (
                        <button onClick={() => handleStatusUpdate(inv.id, "PAID")}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 transition-colors" title="Mark Paid">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
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
              <h2 className="font-display font-bold text-lg">Create Invoice</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
              <div>
                <label className={labelCls}>Client Name*</label>
                <input type="text" required value={form.clientName}
                  onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Client Email</label>
                  <input type="email" value={form.clientEmail}
                    onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Client Phone</label>
                  <input type="tel" value={form.clientPhone}
                    onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Amount (excl. GST)*</label>
                  <input type="number" required min="0" step="0.01" value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>GST Amount</label>
                  <input type="number" min="0" step="0.01" value={form.gstAmount}
                    onChange={e => setForm(p => ({ ...p, gstAmount: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <input type="text" value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 justify-center">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : "Create Invoice"}
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
