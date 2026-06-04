"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, Star, Building2, Globe } from "lucide-react";

type HolidayType = "national" | "optional" | "company";

interface Holiday {
  date: string;
  name: string;
  type: HolidayType;
  day: string;
}

const HOLIDAYS_2026: Holiday[] = [
  // National Holidays
  { date: "Jan 26", day: "Monday",   name: "Republic Day",                 type: "national" },
  { date: "Mar 17", day: "Tuesday",  name: "Holi",                         type: "national" },
  { date: "Apr 6",  day: "Monday",   name: "Ram Navami",                   type: "national" },
  { date: "Apr 14", day: "Tuesday",  name: "Dr. B.R. Ambedkar Jayanti",    type: "national" },
  { date: "Apr 18", day: "Saturday", name: "Good Friday",                  type: "national" },
  { date: "May 1",  day: "Friday",   name: "Maharashtra Day / Labour Day", type: "national" },
  { date: "Aug 15", day: "Saturday", name: "Independence Day",             type: "national" },
  { date: "Aug 19", day: "Wednesday",name: "Janmashtami",                  type: "national" },
  { date: "Sep 7",  day: "Monday",   name: "Ganesh Chaturthi",             type: "national" },
  { date: "Oct 2",  day: "Friday",   name: "Gandhi Jayanti",               type: "national" },
  { date: "Oct 12", day: "Monday",   name: "Dussehra",                     type: "national" },
  { date: "Oct 20", day: "Tuesday",  name: "Diwali (Lakshmi Puja)",        type: "national" },
  { date: "Nov 5",  day: "Thursday", name: "Guru Nanak Jayanti",           type: "national" },
  { date: "Dec 25", day: "Friday",   name: "Christmas Day",                type: "national" },
  // Optional / Restricted
  { date: "Jan 14", day: "Wednesday",name: "Makar Sankranti / Pongal",    type: "optional" },
  { date: "Feb 19", day: "Thursday", name: "Shivaji Jayanti",              type: "optional" },
  { date: "Mar 30", day: "Monday",   name: "Ugadi / Gudi Padwa",          type: "optional" },
  { date: "Apr 10", day: "Friday",   name: "Mahavir Jayanti",              type: "optional" },
  { date: "May 16", day: "Saturday", name: "Buddha Purnima",               type: "optional" },
  { date: "Jun 7",  day: "Sunday",   name: "Eid ul-Fitr",                  type: "optional" },
  { date: "Aug 27", day: "Thursday", name: "Onam",                         type: "optional" },
  { date: "Oct 21", day: "Wednesday",name: "Diwali (Dwitiya)",             type: "optional" },
  { date: "Nov 24", day: "Tuesday",  name: "Guru Tegh Bahadur Ji Shahidi", type: "optional" },
  // Company Holidays
  { date: "Jan 1",  day: "Thursday", name: "New Year's Day",               type: "company" },
  { date: "Apr 21", day: "Tuesday",  name: "Company Foundation Day",       type: "company" },
  { date: "Dec 31", day: "Thursday", name: "Year End",                     type: "company" },
];

const TYPE_CONFIG: Record<HolidayType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  national: { label: "National Holiday", color: "text-red-600",    bg: "bg-red-500/10 border-red-500/20",    icon: Globe },
  optional: { label: "Optional / Restricted", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20", icon: Star },
  company:  { label: "Company Holiday",  color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/20",   icon: Building2 },
};

export default function HolidayClient() {
  const [filter, setFilter] = useState<HolidayType | "all">("all");

  const filtered = filter === "all" ? HOLIDAYS_2026 : HOLIDAYS_2026.filter(h => h.type === filter);

  const upcoming = HOLIDAYS_2026.filter(h => {
    const [mon, d] = h.date.split(" ");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dt = new Date(2026, months.indexOf(mon), parseInt(d));
    return dt >= new Date();
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holiday Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">2026 — National, Optional & Company Holidays</p>
      </div>

      {/* Upcoming Holidays */}
      {upcoming.length > 0 && (
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 text-white shadow-xl shadow-primary/20">
          <p className="text-blue-100 text-xs uppercase tracking-widest font-semibold mb-3">Upcoming Holidays</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upcoming.map(h => {
              const conf = TYPE_CONFIG[h.type];
              return (
                <div key={h.date + h.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-lg font-bold">{h.date}, 2026</p>
                  <p className="text-sm font-semibold mt-0.5">{h.name}</p>
                  <p className="text-xs text-blue-200 mt-1">{h.day} · {conf.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setFilter("all")}
          className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-all",
            filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
          All ({HOLIDAYS_2026.length})
        </button>
        {(Object.entries(TYPE_CONFIG) as [HolidayType, typeof TYPE_CONFIG[HolidayType]][]).map(([key, conf]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2",
              filter === key ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted")}>
            <conf.icon size={14} />
            {conf.label} ({HOLIDAYS_2026.filter(h => h.type === key).length})
          </button>
        ))}
      </div>

      {/* Holiday List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-border">
          {filtered.map(h => {
            const conf = TYPE_CONFIG[h.type];
            const Icon = conf.icon;
            return (
              <div key={h.date + h.name} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                {/* Date block */}
                <div className="w-16 text-center flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{h.date.split(" ")[0]}</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{h.date.split(" ")[1]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">2026</p>
                </div>
                {/* Day badge */}
                <div className="w-16 text-xs text-muted-foreground flex-shrink-0">{h.day}</div>
                {/* Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0", conf.bg)}>
                      <Icon size={13} className={conf.color} />
                    </div>
                    <p className="font-semibold text-sm">{h.name}</p>
                  </div>
                </div>
                {/* Type badge */}
                <span className={cn("hidden sm:inline-flex text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border flex-shrink-0", conf.bg, conf.color)}>
                  {h.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend note */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.entries(TYPE_CONFIG) as [HolidayType, typeof TYPE_CONFIG[HolidayType]][]).map(([key, conf]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full inline-block", {
              "bg-red-500": key === "national",
              "bg-amber-500": key === "optional",
              "bg-blue-500": key === "company",
            })} />
            {conf.label}
          </span>
        ))}
      </div>
    </div>
  );
}
