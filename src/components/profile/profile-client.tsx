"use client";

import { useState } from "react";
import { User, Lock, MapPin, Building2, Briefcase, Mail, Phone, Calendar, Clock, Save, Loader2, CheckCircle2 } from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

interface ProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    employeeId: string;
    role: string;
    designation: string | null;
    department: string | null;
    joinDate: string;
    vendor: {
      name: string;
      state: string | null;
      billingAddress: string | null;
    };
    shiftStart: string;
    shiftEnd: string;
  };
}

export default function ProfileClient({ user }: ProfileProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (displayName === user.name) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      showToast("Profile updated successfully!");
      router.refresh();
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1 ml-13 pl-13">
          View and edit your personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Panel: Profile Summary */}
        <div className="col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg z-10", getAvatarColor(user.name))}>
              {getInitials(user.name)}
            </div>
            
            <h2 className="text-xl font-bold text-foreground z-10">{user.name}</h2>
            <p className="text-sm text-muted-foreground mb-3 z-10">{user.designation || "Employee"}</p>
            
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-6 z-10">
              {user.role}
            </div>

            <div className="w-full border-t border-border/50 pt-4 z-10">
              <div className="flex items-start gap-3 text-left">
                <Building2 size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{user.vendor.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.vendor.state || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-primary/90">
              <User size={16} /> Profile Info
            </button>
            <button 
              onClick={() => router.push('/settings')}
              className="flex-1 bg-card border border-border text-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-muted"
            >
              <Lock size={16} /> Security
            </button>
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Display Name Edit */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Display Name</h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || displayName === user.name}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </div>

          {/* Employment & Contact Info */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1">Employment & Contact Info</h3>
            <p className="text-xs text-muted-foreground mb-6">Contact your HR administrator to update employment records.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <User size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Employee ID</span>
                </div>
                <p className="text-sm font-medium">{user.employeeId || "Not set"}</p>
              </div>

              {/* Box 2 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Department</span>
                </div>
                <p className="text-sm font-medium">{user.department || "Not set"}</p>
              </div>

              {/* Box 3 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Briefcase size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Designation</span>
                </div>
                <p className="text-sm font-medium">{user.designation || "Not set"}</p>
              </div>

              {/* Box 4 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Mail size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Work Email</span>
                </div>
                <p className="text-sm font-medium">{user.email}</p>
              </div>

              {/* Box 5 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Phone size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Phone</span>
                </div>
                <p className="text-sm font-medium">{user.phone || "Not set"}</p>
              </div>

              {/* Box 6 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Joined</span>
                </div>
                <p className="text-sm font-medium">
                  {user.joinDate ? format(parseISO(user.joinDate), "dd MMMM yyyy") : "Not set"}
                </p>
              </div>

              {/* Box 7 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Shift Hours</span>
                </div>
                <p className="text-sm font-medium">{user.shiftStart} - {user.shiftEnd}</p>
              </div>

              {/* Box 8 */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Organization</span>
                </div>
                <p className="text-sm font-medium">{user.vendor.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
