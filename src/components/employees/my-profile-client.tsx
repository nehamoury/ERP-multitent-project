"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  UserCircle, Mail, Phone, MapPin, Briefcase, Building2,
  Calendar, Clock, Edit2, Save, X, CheckCircle2, Link2, User
} from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface ProfileProps {
  user: {
    id: string; name: string; email: string; phone: string | null;
    employeeId: string; role: string;
    fathersName: string | null; address: string | null;
    linkedInUrl: string | null; gender: string | null;
    dateOfBirth: string | null; joinDate: string;
    shiftStart: string; shiftEnd: string; isActive: boolean;
    department: string | null; designation: string | null;
    branch: string | null; team: string | null;
    reportingManager: string | null; reportingManagerEmail: string | null;
  };
}

export default function MyProfileClient({ user: initialUser }: ProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phone: user.phone || "",
    fathersName: user.fathersName || "",
    address: user.address || "",
    linkedInUrl: user.linkedInUrl || "",
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      showToast("Profile updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const infoRow = (label: string, value: string | null | undefined, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      {icon && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
        <div className="flex items-center gap-5">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg", getAvatarColor(user.name))}>
            {getInitials(user.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-blue-200 mt-0.5">{user.designation || user.role}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{user.employeeId}</span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{user.department || "No Department"}</span>
              <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold",
                user.isActive ? "bg-emerald-500/30 text-emerald-100" : "bg-red-500/30 text-red-100")}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-colors border border-white/20"
          >
            {editing ? <X size={16} /> : <Edit2 size={16} />}
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Information */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <User size={15} className="text-primary" /> Personal Information
            </h2>
          </div>
          <div className="p-5">
            {editing ? (
              <div className="space-y-4">
                {[
                  { key: "phone", label: "Phone Number", type: "tel", placeholder: "+91 9876543210" },
                  { key: "fathersName", label: "Father's Name", type: "text", placeholder: "Father's full name" },
                  { key: "linkedInUrl", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/..." },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={(editForm as any)[key]}
                      onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    rows={3}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Your full address"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {saving ? "Saving..." : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            ) : (
              <div>
                {infoRow("Email", user.email, <Mail size={14} className="text-primary" />)}
                {infoRow("Phone", user.phone, <Phone size={14} className="text-blue-500" />)}
                {infoRow("Gender", user.gender, <UserCircle size={14} className="text-purple-500" />)}
                {infoRow("Date of Birth", user.dateOfBirth ? format(parseISO(user.dateOfBirth), "dd MMMM yyyy") : null, <Calendar size={14} className="text-amber-500" />)}
                {infoRow("Father's Name", user.fathersName, <User size={14} className="text-emerald-500" />)}
                {infoRow("Address", user.address, <MapPin size={14} className="text-red-500" />)}
                {user.linkedInUrl && (
                  <div className="flex items-start gap-3 py-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Link2 size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">LinkedIn</p>
                      <a href={user.linkedInUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate block mt-0.5">
                        {user.linkedInUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Briefcase size={15} className="text-primary" /> Work Information
            </h2>
          </div>
          <div className="p-5">
            {infoRow("Employee ID", user.employeeId, <UserCircle size={14} className="text-primary" />)}
            {infoRow("Role", user.role, <Briefcase size={14} className="text-blue-500" />)}
            {infoRow("Department", user.department, <Building2 size={14} className="text-purple-500" />)}
            {infoRow("Designation", user.designation, <Briefcase size={14} className="text-amber-500" />)}
            {infoRow("Branch", user.branch, <MapPin size={14} className="text-red-500" />)}
            {infoRow("Team", user.team, <User size={14} className="text-emerald-500" />)}
            {infoRow("Reporting Manager", user.reportingManager, <UserCircle size={14} className="text-cyan-500" />)}
            {infoRow("Joining Date", user.joinDate ? format(parseISO(user.joinDate), "dd MMMM yyyy") : null, <Calendar size={14} className="text-indigo-500" />)}
            {infoRow("Shift Timing", `${user.shiftStart} – ${user.shiftEnd}`, <Clock size={14} className="text-orange-500" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
