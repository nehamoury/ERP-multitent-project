"use client";

import { useState } from "react";
import { format } from "date-fns";
import { LogIn, LogOut, Check, Loader2, QrCode, X } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import AttendanceClient from "@/components/attendance/attendance-client";
import EmployeeScanner from "@/components/qr/employee-scanner";

interface Props {
  userId: string;
  userName: string;
  todayRecord: any;
}

export default function MyAttendanceClient({ userId, userName, todayRecord: initialRecord }: Props) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckIn = async () => {
    setLoading("in");
    try {
      const res = await fetch("/api/attendance/checkin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecord(data.record);
      showToast(`Checked in at ${formatTime(new Date())}`);
      router.refresh();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(null); }
  };

  const handleCheckOut = async () => {
    setLoading("out");
    try {
      const res = await fetch("/api/attendance/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecord((p: any) => ({ ...p, checkOut: new Date().toISOString(), workingHours: data.workingHours }));
      showToast(`Checked out successfully!`);
      router.refresh();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setLoading(null); }
  };

  const hasCheckedIn = !!record?.checkIn;
  const hasCheckedOut = !!record?.checkOut;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Hero Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete attendance history</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            {hasCheckedOut ? <Check size={24} className="text-emerald-500" /> : <LogIn size={24} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {hasCheckedOut ? "Day Complete" : hasCheckedIn ? "Clocked In" : "Not Clocked In"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasCheckedOut 
                ? `You worked ${record.workingHours?.toFixed(1)} hours today.` 
                : hasCheckedIn 
                  ? `Clocked in at ${formatTime(record.checkIn)}` 
                  : "You haven't marked your attendance today."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowQrModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors border border-border"
          >
            <QrCode size={18} /> Scan QR
          </button>

          {!hasCheckedIn && (
            <button onClick={handleCheckIn} disabled={!!loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60">
              {loading === "in" ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              Clock In Now
            </button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <button onClick={handleCheckOut} disabled={!!loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-sm disabled:opacity-60">
              {loading === "out" ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              Clock Out
            </button>
          )}
        </div>
      </div>

      <div className="pt-2 mt-8">
        <AttendanceClient userId={userId} />
      </div>

      {/* Simple QR Scanner Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-border">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <h2 className="font-bold text-base">Scan QR Code</h2>
              <button onClick={() => setShowQrModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <EmployeeScanner onSuccess={() => {
                setTimeout(() => {
                  setShowQrModal(false);
                  router.refresh();
                }, 2500);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
