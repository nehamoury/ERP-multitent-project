"use client";

import { useState, useEffect, useCallback } from "react";
import { LifeBuoy, Plus, Search, Loader2, X, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Button, EmptyState } from "@/components/ui/shared";

const PRIORITY_COLORS: any = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700"
};

const STATUS_COLORS: any = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-gray-100 text-gray-700",
  CLOSED: "bg-gray-200 text-gray-500"
};

export default function TicketsClient({ isAdmin }: { isAdmin?: boolean }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({ subject: "", description: "", priority: "MEDIUM" });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ subject: "", description: "", priority: "MEDIUM" });
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Ticket
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="You don't have any support tickets yet." />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/20">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Date</th>
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground mb-1">{t.subject}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">By {t.creator.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider", STATUS_COLORS[t.status] || "bg-gray-100")}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider", PRIORITY_COLORS[t.priority] || "bg-gray-100")}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(t.createdAt, "dd MMM yyyy")}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={t.status} 
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="text-xs p-1.5 border border-border rounded-lg bg-card"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Raise Support Ticket</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Subject *</label>
                <input required value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm" placeholder="Issue with payroll" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm resize-none" placeholder="Please describe the issue..." />
              </div>
              <Button type="submit" disabled={submitting} className="w-full mt-2">
                {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : "Submit Ticket"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
