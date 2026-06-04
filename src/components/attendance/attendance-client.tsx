// src/components/attendance/attendance-client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { RefreshCw, Loader2, Filter, ChevronLeft, ChevronRight, QrCode, ArrowLeft, Plus, Download, X, Clock, UserCheck } from "lucide-react";
import { cn, getStatusColor, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/shared";
import AdminQRGeneratorClient from "@/components/qr/admin-qr-generator";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | null;
  status: string;
  isLate: boolean;
  lateMinutes: number | null;
  note?: string | null;
  user?: { id: string; name: string; employeeId: string; department: any };
}

interface Props {
  isAdmin?: boolean;
  userId?: string;
}

export default function AttendanceClient({ isAdmin, userId }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ lateCount: 0, checkedInCount: 0 });

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [filterMode, setFilterMode] = useState("date");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [employees, setEmployees] = useState<{id: string, name: string, employeeId: string}[]>([]);
  
  // Manual Entry Form State
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    action: "checkin",
    time: format(new Date(), "HH:mm"),
    reason: ""
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?limit=1000");
      const data = await res.json();
      if (data.users) setEmployees(data.users);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin) fetchEmployees();
  }, [isAdmin, fetchEmployees]);

  const submitManualEntry = async () => {
    if (!manualForm.employeeId || !manualForm.reason) {
      alert("Please select an employee and provide a reason.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Manual entry recorded successfully.");
      setShowManualEntry(false);
      setManualForm(f => ({ ...f, reason: "" }));
      fetchRecords(); // Refresh the table
    } catch (err: any) {
      alert(err.message || "Failed to submit manual entry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterMode === "date" && dateFilter) params.set("date", dateFilter);
      if (filterMode === "month" && monthFilter) {
        const [year, month] = monthFilter.split("-");
        params.set("year", year);
        params.set("month", month);
      }
      if (isAdmin && employeeFilter) {
        params.set("userId", employeeFilter);
      } else if (userId) {
        params.set("userId", userId);
      }
      
      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      const filtered = statusFilter
        ? (data.records || []).filter((r: AttendanceRecord) => {
            const isActuallyLate = r.isLate && r.lateMinutes && r.lateMinutes > 0;
            const displayStatus = isActuallyLate ? "LATE" : r.status;
            return displayStatus === statusFilter;
          })
        : (data.records || []);
      setRecords(filtered);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setStats({ lateCount: data.lateCount || 0, checkedInCount: data.checkedInCount || 0 });
    } catch { }
    finally { setLoading(false); }
  }, [page, dateFilter, monthFilter, filterMode, statusFilter, employeeFilter, userId, isAdmin]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const formatHours = (hours: number | null) => {
    if (!hours) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold hidden lg:block">
          Attendance
        </h2>
        
        {isAdmin && (
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <Button 
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <QrCode size={16} className="mr-2" /> Live QR Code
            </Button>
            <Button 
              variant="outline" 
              className="bg-card text-foreground hover:bg-muted"
              onClick={() => setShowManualEntry(true)}
            >
              <Plus size={16} className="mr-2" /> Manual Entry
            </Button>
            <Button variant="outline" className="bg-card text-foreground hover:bg-muted">
              <Download size={16} className="mr-2" /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Late</div>
              <div className="text-2xl font-bold">{stats.lateCount}</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck size={20} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Checked In</div>
              <div className="text-2xl font-bold">{stats.checkedInCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1f2e] text-white w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl flex flex-col relative border border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#1a1f2e] z-10">
              <h2 className="text-lg font-semibold">Attendance QR Code</h2>
              <button 
                onClick={() => setShowScanner(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2">
              <AdminQRGeneratorClient />
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1f2e] text-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1a1f2e] z-10">
              <h2 className="text-lg font-semibold">Manual Attendance Entry</h2>
              <button 
                onClick={() => setShowManualEntry(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/90">Employee *</label>
                <select 
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({...manualForm, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-white/90">Date *</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-white/90">Action *</label>
                  <select 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={manualForm.action}
                    onChange={(e) => setManualForm({...manualForm, action: e.target.value})}
                  >
                    <option value="checkin">Check In</option>
                    <option value="checkout">Check Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/90">Time *</label>
                <div className="relative">
                  <input 
                    type="time" 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={manualForm.time}
                    onChange={(e) => setManualForm({...manualForm, time: e.target.value})}
                  />
                  <Clock size={16} className="absolute right-3 top-3 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/90">Reason (Audit Log) *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Forgot check-in"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({...manualForm, reason: e.target.value})}
                />
                <p className="text-xs text-white/40 mt-2">This will be permanently recorded in the audit log.</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#1a1f2e] flex items-center justify-between gap-3">
              <button 
                onClick={() => setShowManualEntry(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                onClick={submitManualEntry}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {isAdmin && (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Employee</label>
            <select
              value={employeeFilter}
              onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter Mode</label>
          <select
            value={filterMode}
            onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="date">Specific Date</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {filterMode === "date" ? "Date" : "Month"}
          </label>
          <div className="relative">
            <input
              type={filterMode === "date" ? "date" : "month"}
              value={filterMode === "date" ? dateFilter : monthFilter}
              onChange={(e) => {
                if (filterMode === "date") setDateFilter(e.target.value);
                else setMonthFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Status</option>
            {["PRESENT","LATE","ABSENT","HALF_DAY","WORK_FROM_HOME","ON_LEAVE"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => {
            setEmployeeFilter("");
            setFilterMode("date");
            setDateFilter(format(new Date(), "yyyy-MM-dd"));
            setMonthFilter(format(new Date(), "yyyy-MM"));
            setStatusFilter("");
            setPage(1);
          }}
          className="px-4 py-2 bg-card border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors h-[38px] flex items-center justify-center min-w-[100px]"
        >
          Clear
        </button>
      </div>

      <div className="text-sm text-muted-foreground">{total} records</div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {[
                  isAdmin ? "Employee" : null,
                  "Date", "Check In", "Check Out", "Duration", "Status", "Remark", isAdmin ? "Actions" : null
                ].filter(Boolean).map(h => (
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
              {!loading && records.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">
                  No attendance records found
                </td></tr>
              )}
              {records.map((r) => {
                const isActuallyLate = r.isLate && r.lateMinutes && r.lateMinutes > 0;
                const displayStatus = isActuallyLate ? "LATE" : r.status;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.user?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.user?.department?.name ?? ""}</p>
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(parseISO(r.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {r.checkIn ? formatTime(r.checkIn) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.checkOut ? formatTime(r.checkOut) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatHours(r.workingHours)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold", 
                          displayStatus === "LATE" ? "bg-amber-500/10 text-amber-500" : getStatusColor(displayStatus)
                        )}>
                          {displayStatus}
                        </span>
                        {isActuallyLate && (
                          <span className="text-[10px] text-amber-500 font-medium whitespace-nowrap">
                            -{Math.floor((r.lateMinutes || 0)/60)}h {(r.lateMinutes || 0)%60}m late
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate" title={r.note || ""}>
                      {r.note || "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button 
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                          onClick={() => {
                            setManualForm({
                              employeeId: r.user?.id || "",
                              date: r.date.split("T")[0],
                              action: r.checkOut ? "checkout" : "checkin",
                              time: r.checkOut ? format(new Date(r.checkOut), "HH:mm") : (r.checkIn ? format(new Date(r.checkIn), "HH:mm") : ""),
                              reason: r.note || ""
                            });
                            setShowManualEntry(true);
                          }}
                          title="Edit Manual Entry"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
