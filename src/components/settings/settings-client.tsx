"use client";

import { useState } from "react";
import { Loader2, Save, Building2, Clock, Calendar as CalendarIcon, ShieldCheck, Mail, Phone, MapPin, Link2, Globe, FileText, Upload, Settings2, Wallet, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialSettings: any;
}

const DAY_MAP = [
  { id: 1, name: "Mon" },
  { id: 2, name: "Tue" },
  { id: 3, name: "Wed" },
  { id: 4, name: "Thu" },
  { id: 5, name: "Fri" },
  { id: 6, name: "Sat" },
  { id: 7, name: "Sun" },
];

export default function SettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState({
    // 1. Company Information
    companyName: initialSettings?.companyName ?? "",
    companyCode: initialSettings?.companyCode ?? "",
    companyEmail: initialSettings?.companyEmail ?? "",
    companyPhone: initialSettings?.companyPhone ?? "",
    address: initialSettings?.address ?? "",
    gstNumber: initialSettings?.gstNumber ?? "",
    website: initialSettings?.website ?? "",
    
    // 2. Shift Configuration
    workingHoursStart: initialSettings?.workingHoursStart ?? "09:00",
    workingHoursEnd: initialSettings?.workingHoursEnd ?? "18:00",
    breakStart: initialSettings?.breakStart ?? "",
    breakEnd: initialSettings?.breakEnd ?? "",
    gracePeriod: String(initialSettings?.gracePeriod ?? "15"),
    
    // 3. Working Days
    workingDays: Array.isArray(initialSettings?.workingDays) ? initialSettings.workingDays : [1, 2, 3, 4, 5],
    halfDaySupport: initialSettings?.halfDaySupport ?? false,

    // 4. Attendance Policy
    lateThreshold: String(initialSettings?.lateThreshold ?? "15"),
    halfDayThreshold: String(initialSettings?.halfDayThreshold ?? "240"),
    absentThreshold: String(initialSettings?.absentThreshold ?? "480"),
    minimumWorkingHours: String(initialSettings?.minimumWorkingHours ?? "8"),
    overtimeEnabled: initialSettings?.overtimeEnabled ?? false,
    timezone: initialSettings?.timezone ?? "Asia/Kolkata",
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (dayId: number) => {
    setForm(prev => {
      const isSelected = prev.workingDays.includes(dayId);
      let newDays = isSelected 
        ? prev.workingDays.filter((d: number) => d !== dayId)
        : [...prev.workingDays, dayId];
      return { ...prev, workingDays: newDays };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const TIMEZONES = [
    "Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London",
    "America/New_York","America/Los_Angeles","Australia/Sydney",
  ];

  // Calculate shift duration
  const startParts = form.workingHoursStart.split(":").map(Number);
  const endParts = form.workingHoursEnd.split(":").map(Number);
  let durationHrs = 0;
  if (startParts.length === 2 && endParts.length === 2) {
    const startMins = startParts[0] * 60 + startParts[1];
    const endMins = endParts[0] * 60 + endParts[1];
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60;
    durationHrs = diff / 60;
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <form onSubmit={handleSave} className="space-y-8">
        
        {/* 1. Company Information */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b border-border">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Building2 size={18} className="text-blue-500" /> Company Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Company Name</label>
                <input 
                  value={form.companyName} 
                  onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Company Code</label>
                <input 
                  value={form.companyCode} 
                  onChange={e => setForm(p => ({ ...p, companyCode: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Email Address</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={form.companyEmail} 
                    onChange={e => setForm(p => ({ ...p, companyEmail: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Phone Number</label>
                <div className="relative">
                  <input 
                    value={form.companyPhone} 
                    onChange={e => setForm(p => ({ ...p, companyPhone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Full Address</label>
                <div className="relative">
                  <input 
                    value={form.address} 
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">GSTIN / Tax ID</label>
                <div className="relative">
                  <input 
                    value={form.gstNumber} 
                    onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                  <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Website</label>
                <div className="relative">
                  <input 
                    value={form.website} 
                    onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  />
                  <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Shift Configuration */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
          <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock size={18} className="text-purple-500" /> Shift Configuration
            </h2>
            <div className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
              {durationHrs.toFixed(1)} hrs/day
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Shift Start</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={form.workingHoursStart} 
                  onChange={e => setForm(p => ({ ...p, workingHoursStart: e.target.value }))}
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  required
                />
                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Shift End</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={form.workingHoursEnd} 
                  onChange={e => setForm(p => ({ ...p, workingHoursEnd: e.target.value }))}
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  required
                />
                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Grace Period (Mins)</label>
              <input 
                type="number" 
                value={form.gracePeriod} 
                onChange={e => setForm(p => ({ ...p, gracePeriod: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Break Start (Optional)</label>
              <input 
                type="time" 
                value={form.breakStart} 
                onChange={e => setForm(p => ({ ...p, breakStart: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Break End (Optional)</label>
              <input 
                type="time" 
                value={form.breakEnd} 
                onChange={e => setForm(p => ({ ...p, breakEnd: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
              />
            </div>
          </div>
        </section>

        {/* 3. Working Days */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
          <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <CalendarIcon size={18} className="text-emerald-500" /> Working Days
            </h2>
            <div className="text-emerald-500 text-xs font-bold tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full">
              {form.workingDays.length} days/week
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {DAY_MAP.map(day => {
                const isSelected = form.workingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border hover:text-foreground"
                    )}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex-1">
                <p className="text-sm font-semibold">Half Day Support</p>
                <p className="text-xs text-muted-foreground mt-1">Allow employees to check-in for half a working day.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.halfDaySupport} 
                  onChange={e => setForm(p => ({ ...p, halfDaySupport: e.target.checked }))} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* 4. Attendance Policy */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b border-border">
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" /> Attendance Policy
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Late Threshold (Mins)</label>
              <input 
                type="number" 
                value={form.lateThreshold}
                onChange={e => setForm(p => ({ ...p, lateThreshold: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">Mins after start before marked late</p>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Half Day Threshold (Mins)</label>
              <input 
                type="number" 
                value={form.halfDayThreshold}
                onChange={e => setForm(p => ({ ...p, halfDayThreshold: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">Mins required to avoid Half Day</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Absent Threshold (Mins)</label>
              <input 
                type="number" 
                value={form.absentThreshold}
                onChange={e => setForm(p => ({ ...p, absentThreshold: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">Mins required to avoid Absent</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Min. Working Hours</label>
              <input 
                type="number" 
                value={form.minimumWorkingHours}
                onChange={e => setForm(p => ({ ...p, minimumWorkingHours: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                required
              />
            </div>

            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border col-span-1 md:col-span-2">
              <div className="flex-1">
                <p className="text-sm font-semibold">Enable Overtime Tracking</p>
                <p className="text-xs text-muted-foreground mt-1">Automatically log excess hours as overtime payload.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.overtimeEnabled} 
                  onChange={e => setForm(p => ({ ...p, overtimeEnabled: e.target.checked }))} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Timezone</label>
              <div className="relative">
                <select 
                  value={form.timezone} 
                  onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                  {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                </select>
                <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <div className="pt-2 sticky bottom-6 z-10 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saved ? "Settings Saved!" : "Save Organization Settings"}
          </button>
        </div>
      </form>

      {/* 5. Future Ready Sections */}
      <section className="pt-8 border-t border-border mt-12">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Upcoming Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border border-dashed rounded-xl p-5 opacity-60">
            <CalendarIcon size={20} className="text-muted-foreground mb-3" />
            <h4 className="font-semibold text-sm mb-1">Leave Policy</h4>
            <p className="text-xs text-muted-foreground">Configure paid time off, sick leaves, and accrual rates.</p>
            <div className="mt-4 text-[10px] font-bold bg-muted w-max px-2 py-1 rounded text-muted-foreground uppercase">Coming Soon</div>
          </div>
          <div className="bg-card border border-border border-dashed rounded-xl p-5 opacity-60">
            <Wallet size={20} className="text-muted-foreground mb-3" />
            <h4 className="font-semibold text-sm mb-1">Payroll Settings</h4>
            <p className="text-xs text-muted-foreground">Manage salary components, tax rules, and pay cycles.</p>
            <div className="mt-4 text-[10px] font-bold bg-muted w-max px-2 py-1 rounded text-muted-foreground uppercase">Coming Soon</div>
          </div>
          <div className="bg-card border border-border border-dashed rounded-xl p-5 opacity-60">
            <MessageSquare size={20} className="text-muted-foreground mb-3" />
            <h4 className="font-semibold text-sm mb-1">Chat Settings</h4>
            <p className="text-xs text-muted-foreground">Set retention policies and access controls for internal chat.</p>
            <div className="mt-4 text-[10px] font-bold bg-muted w-max px-2 py-1 rounded text-muted-foreground uppercase">Coming Soon</div>
          </div>
        </div>
      </section>
    </div>
  );
}
