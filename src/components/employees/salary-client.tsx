"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, Download, Calendar, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function StatusBadge({ status }: { status: string }) {
  const s = {
    PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    PROCESSED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    DRAFT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  }[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border", s)}>
      {status}
    </span>
  );
}

export default function SalaryClient() {
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-payroll"],
    queryFn: async () => {
      const res = await fetch("/api/payroll?limit=24");
      return res.json();
    },
  });

  const payrolls: any[] = data?.payrolls || [];
  const latest = payrolls[0];

  const totalPaid = payrolls
    .filter(p => p.status === "PAID")
    .reduce((s, p) => s + p.netAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Payroll</h1>
        <p className="text-sm text-muted-foreground mt-1">View your payslips and payroll history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="text-sm text-blue-100">Latest Salary</span>
          </div>
          {latest ? (
            <>
              <p className="text-3xl font-bold">₹{latest.netAmount.toLocaleString("en-IN")}</p>
              <p className="text-blue-200 text-sm mt-1">{MONTHS[latest.month - 1]} {latest.year}</p>
              <StatusBadge status={latest.status} />
            </>
          ) : (
            <p className="text-blue-200 text-sm">No salary records yet</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm text-muted-foreground">Total Received</span>
          </div>
          <p className="text-2xl font-bold text-foreground">₹{totalPaid.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">{payrolls.filter(p => p.status === "PAID").length} payslips paid</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <span className="text-sm text-muted-foreground">Total Records</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{payrolls.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all months</p>
        </div>
      </div>

      {/* Payslip History */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Payslip History</h2>
          <p className="text-sm text-muted-foreground">Click a row to view details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase border-b border-border">
              <tr>
                {["Month", "Basic Salary", "Allowances", "Deductions", "Net Pay", "Status", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <RefreshCw size={20} className="animate-spin mx-auto text-primary" />
                </td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No payslip records found. Contact HR to process your salary.
                </td></tr>
              ) : payrolls.map((p) => (
                <tr key={p.id}
                  onClick={() => setSelectedPayslip(p)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-5 py-4 font-medium">
                    {MONTHS[p.month - 1]} {p.year}
                  </td>
                  <td className="px-5 py-4 tabular-nums">₹{p.basicSalary.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 tabular-nums text-emerald-600">+₹{p.allowances.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 tabular-nums text-red-500">-₹{p.deductions.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 tabular-nums font-bold text-foreground">₹{p.netAmount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPayslip(p); }}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      <Download size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-700 px-6 py-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wider">Payslip</p>
                  <h2 className="text-xl font-bold mt-0.5">{MONTHS[selectedPayslip.month - 1]} {selectedPayslip.year}</h2>
                  <p className="text-blue-200 text-sm mt-1">{selectedPayslip.user?.name}</p>
                </div>
                <StatusBadge status={selectedPayslip.status} />
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              {[
                { label: "Basic Salary", value: `₹${selectedPayslip.basicSalary.toLocaleString("en-IN")}`, color: "text-foreground" },
                { label: "Allowances", value: `+₹${selectedPayslip.allowances.toLocaleString("en-IN")}`, color: "text-emerald-600" },
                { label: "Deductions", value: `-₹${selectedPayslip.deductions.toLocaleString("en-IN")}`, color: "text-red-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={cn("font-semibold tabular-nums", color)}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 bg-primary/5 rounded-xl px-4 border border-primary/20">
                <span className="font-bold text-foreground">Net Pay</span>
                <span className="text-xl font-bold text-primary tabular-nums">
                  ₹{selectedPayslip.netAmount.toLocaleString("en-IN")}
                </span>
              </div>
              {selectedPayslip.paidAt && (
                <p className="text-xs text-muted-foreground text-center">
                  Paid on {new Date(selectedPayslip.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              {selectedPayslip.notes && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{selectedPayslip.notes}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download size={15} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
