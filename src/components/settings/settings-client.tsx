// src/components/settings/settings-client.tsx
"use client";

import { useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/shared";

interface Props {
  initialSettings: any;
}

export default function SettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState({
    companyName: initialSettings?.companyName ?? "AttendIQ Corp",
    workingHoursStart: initialSettings?.workingHoursStart ?? "09:00",
    workingHoursEnd: initialSettings?.workingHoursEnd ?? "18:00",
    lateThreshold: String(initialSettings?.lateThreshold ?? "15"),
    timezone: initialSettings?.timezone ?? "Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // In a real app, POST to /api/settings
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TIMEZONES = [
    "Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London",
    "America/New_York","America/Los_Angeles","Australia/Sydney",
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-display font-semibold mb-4 pb-3 border-b border-border">Company Information</h3>
          <div>
            <label className="text-sm font-medium block mb-1.5">Company Name</label>
            <input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div>
          <h3 className="font-display font-semibold mb-4 pb-3 border-b border-border">Shift Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Shift Start Time</label>
              <input type="time" value={form.workingHoursStart} onChange={e => setForm(p => ({ ...p, workingHoursStart: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Shift End Time</label>
              <input type="time" value={form.workingHoursEnd} onChange={e => setForm(p => ({ ...p, workingHoursEnd: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-display font-semibold mb-4 pb-3 border-b border-border">Attendance Policy</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Late Threshold (minutes)</label>
              <input type="number" min="0" max="60" value={form.lateThreshold}
                onChange={e => setForm(p => ({ ...p, lateThreshold: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-xs text-muted-foreground mt-1">Grace period before marking as "Late"</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Timezone</label>
              <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
                {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : saved ? <><Check size={15} /> Saved!</>
              : <><Save size={15} /> Save Settings</>}
          </Button>
        </div>
      </form>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-semibold mb-2">Database</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">PostgreSQL connected</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Prisma ORM • Production ready</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-semibold mb-2">Email Service</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">SMTP configured</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Configure in .env file</p>
        </div>
      </div>
    </div>
  );
}
