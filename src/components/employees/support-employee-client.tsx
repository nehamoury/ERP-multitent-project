"use client";

import { useState, useEffect } from "react";
import { Headphones, Plus, AlertCircle, CheckCircle2, Clock, X, MessageSquare, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock tickets type
interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
}

export default function SupportEmployeeClient() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "", subject: "", description: "" });
  const [toast, setToast] = useState<string | null>(null);

  // Load mock tickets on mount
  useEffect(() => {
    const saved = localStorage.getItem("employee_tickets");
    if (saved) {
      setTickets(JSON.parse(saved));
    } else {
      const mock: SupportTicket[] = [
        { id: "TKT-001", category: "Salary", subject: "Salary discrepancy", description: "Less amount credited for last month.", status: "RESOLVED", createdAt: new Date(Date.now() - 5 * 24*60*60*1000).toISOString() },
        { id: "TKT-002", category: "Leave", subject: "Leave not approved", description: "My sick leave is pending for 2 days.", status: "IN_PROGRESS", createdAt: new Date(Date.now() - 2 * 24*60*60*1000).toISOString() }
      ];
      setTickets(mock);
      localStorage.setItem("employee_tickets", JSON.stringify(mock));
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.subject || !form.description) return;
    
    const newTicket: SupportTicket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
      category: form.category,
      subject: form.subject,
      description: form.description,
      status: "OPEN",
      createdAt: new Date().toISOString()
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem("employee_tickets", JSON.stringify(updated));
    setShowModal(false);
    setForm({ category: "", subject: "", description: "" });
    showToast("Ticket raised successfully! HR will review it soon.");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">Raise tickets for HR and admin support</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> Raise Ticket
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Tickets", val: tickets.length, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Ticket },
          { label: "Open / In Progress", val: tickets.filter(t => t.status !== "RESOLVED").length, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Clock },
          { label: "Resolved", val: tickets.filter(t => t.status === "RESOLVED").length, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 }
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", s.color)}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.val}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <MessageSquare size={15} className="text-primary" /> My Tickets
          </h2>
        </div>
        <div className="divide-y divide-border">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Headphones size={40} className="mx-auto mb-3 opacity-20" />
              <p>No tickets raised yet.</p>
            </div>
          ) : tickets.map((t) => (
            <div key={t.id} className="p-5 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t.id}</span>
                  <h3 className="font-semibold text-foreground">{t.subject}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border", 
                    t.status === "OPEN" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                    t.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {t.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="font-bold text-lg">Raise Support Ticket</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
                <select 
                  required
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Category</option>
                  <option value="Salary">Salary Issue</option>
                  <option value="Attendance">Attendance Issue</option>
                  <option value="Leave">Leave Issue</option>
                  <option value="General">General Query</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Subject</label>
                <input 
                  required
                  type="text"
                  placeholder="Brief summary of issue"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Detailed description of your problem..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                  Submit Ticket
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-card border border-border text-foreground font-medium text-sm rounded-xl hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
