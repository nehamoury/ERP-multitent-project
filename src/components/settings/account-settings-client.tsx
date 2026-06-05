"use client";

import { useState } from "react";
import { Settings, User, Lock, Bell, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    companyName: string;
  };
}

export default function AccountSettingsClient({ user }: SettingsProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (fullName === user.name) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      showToast("Profile details updated successfully!");
      router.refresh();
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || newPassword.length < 8) {
      showToast("Please provide current password and a new password with at least 8 characters.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update password");
      }
      showToast("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Settings size={20} />
          </div>
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1 ml-13 pl-13">
          Manage your account preferences, company branding, and security
        </p>
      </div>

      <div className="space-y-6 pt-4">
        {/* Profile Details */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
            <User size={16} className="text-primary" /> Profile Details
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Manage your personal details and identity settings</p>
          
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email Address (Read-only)</label>
              <input
                type="text"
                value={user.email}
                readOnly
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground opacity-70 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Company Name</label>
              <input
                type="text"
                value={user.companyName}
                readOnly
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground opacity-70 cursor-not-allowed focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || fullName === user.name}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
              Save Profile Details
            </button>
          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
            <Lock size={16} className="text-blue-500" /> Security & Password
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Update your password to keep your account secure</p>
          
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-1.5 block">New Password (Min. 8 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleUpdatePassword}
              disabled={isSavingPassword || !currentPassword || newPassword.length < 8}
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingPassword && <Loader2 size={16} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
            <Bell size={16} className="text-amber-500" /> Notifications
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Choose what updates you want to receive</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
              <div>
                <p className="text-sm font-semibold">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receive attendance reports and payroll alerts via email</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
              <div>
                <p className="text-sm font-semibold">Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get real-time alerts on your mobile device for notices</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
