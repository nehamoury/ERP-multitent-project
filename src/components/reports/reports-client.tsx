// src/components/reports/reports-client.tsx
"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/shared";
import { MONTHS } from "@/lib/utils";

interface Summary {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  avgHours: number;
}

export default function ReportsClient() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [deptBreakdown, setDeptBreakdown] = useState<any[]>([]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      const data = await res.json();
      setSummary(data.summary);
      setTrend(data.trend || []); // show all days
      setDeptBreakdown(data.deptBreakdown || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [month, year]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}&export=csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${year}-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
    finally { setExporting(false); }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const res = await fetch(`/api/reports?month=${month}&year=${year}&export=data`);
      const data = await res.json();
      const records = data.records || [];

      const doc = new jsPDF();
      const monthName = MONTHS[parseInt(month) - 1];

      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text("AttendIQ", 14, 20);
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`Attendance Report – ${monthName} ${year}`, 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

      // Summary boxes
      if (summary) {
        const cols = [["Metric", "Value"]];
        const rows = [
          ["Total Employees", String(summary.totalEmployees)],
          ["Present (total records)", String(summary.presentCount)],
          ["Late Arrivals", String(summary.lateCount)],
          ["Avg Working Hours", `${summary.avgHours.toFixed(1)}h`],
        ];
        autoTable(doc, { startY: 46, head: cols, body: rows, theme: "grid",
          headStyles: { fillColor: [59, 130, 246] }, styles: { fontSize: 9 }, margin: { left: 14 }, tableWidth: 80 });
      }

      // Attendance table
      const tableY = (doc as any).lastAutoTable?.finalY + 10 || 100;
      autoTable(doc, {
        startY: tableY,
        head: [["Emp ID", "Name", "Dept", "Date", "Check In", "Check Out", "Hours", "Status"]],
        body: records.slice(0, 100).map((r: any) => [
          r.user?.employeeId ?? "",
          r.user?.name ?? "",
          r.user?.department ?? "",
          new Date(r.date).toLocaleDateString(),
          r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
          r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
          r.workingHours ? `${r.workingHours.toFixed(1)}h` : "—",
          r.status,
        ]),
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 } },
        theme: "striped",
      });

      doc.save(`attendance-${year}-${month}.pdf`);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Month:</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
            {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Year:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
            {[2022, 2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={fetchReport} className="p-1.5 hover:bg-muted rounded-lg">
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={exportCSV} disabled={exporting}>
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Export CSV
          </Button>
          <Button onClick={exportPDF} disabled={exporting}>
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Employees", value: summary.totalEmployees, color: "text-blue-600" },
            { label: "Present Records", value: summary.presentCount, color: "text-emerald-600" },
            { label: "Late Records", value: summary.lateCount, color: "text-amber-600" },
            { label: "Absent Records", value: summary.absentCount, color: "text-red-600" },
            { label: "Avg Hours/Day", value: `${summary.avgHours.toFixed(1)}h`, color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Daily Attendance Trend – {MONTHS[parseInt(month) - 1]} {year}</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trend} margin={{ left: -20, top: 20, right: 10, bottom: 10 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
                        <p className="font-semibold text-sm mb-3 pb-2 border-b border-border/50 text-foreground">
                          {MONTHS[parseInt(month) - 1]} {label}, {year}
                        </p>
                        <div className="space-y-2.5">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-sm font-medium">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                                <span className="text-muted-foreground">{entry.name}</span>
                              </div>
                              <span className="tabular-nums font-bold" style={{ color: entry.color }}>{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(v) => <span className="text-sm font-medium text-muted-foreground ml-1">{v}</span>} 
                iconType="circle"
              />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
