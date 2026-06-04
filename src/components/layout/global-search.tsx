// src/components/layout/global-search.tsx
"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, Briefcase, Calendar, Clock, LayoutDashboard, DollarSign, Wallet, Settings, ChevronRight, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GlobalSearchProps {
  userRole: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function GlobalSearch({ userRole, open, setOpen }: GlobalSearchProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getBasePath = (role: string) => {
    if (role === 'SUPER_ADMIN') return '/super-admin';
    if (role === 'EMPLOYEE') return '/employee';
    if (role === 'HR') return '/hr';
    return '/admin';
  };
  
  const basePath = getBasePath(userRole);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", search],
    queryFn: async () => {
      if (search.length < 2) return null;
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
      return res.json();
    },
    enabled: search.length >= 2,
  });

  const onSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setOpen(false)}
        >
          <div 
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border bg-card shadow-2xl sm:rounded-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="flex w-full flex-col overflow-hidden bg-transparent text-popover-foreground">
          
          <div className="flex items-center border-b border-border/40 px-5 py-4">
            <Search className="mr-3 h-5 w-5 text-muted-foreground" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages (e.g., 'Attendance', 'Payroll', 'Settings')..."
              className="flex h-8 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
            <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
              {isLoading ? "Searching..." : search.length < 2 ? "Type at least 2 characters to search" : "No results found."}
            </Command.Empty>

            {data?.employees?.length > 0 && (
              <Command.Group heading="Employees" className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wider">
                {data.employees.map((emp: any) => (
                  <Command.Item
                    key={emp.id}
                    value={emp.name}
                    onSelect={() => onSelect(`${basePath}/employees/${emp.id}`)}
                    className="group relative flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none hover:bg-blue-600 hover:text-white transition-all duration-200 mb-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-white/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold text-[15px]">{emp.name}</span>
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-blue-100 uppercase">{emp.role}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.departments?.length > 0 && (
              <Command.Group heading="Departments" className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wider">
                {data.departments.map((dept: any) => (
                  <Command.Item
                    key={dept.id}
                    value={dept.name}
                    onSelect={() => onSelect(`${basePath}/organization/departments`)}
                    className="group relative flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none hover:bg-blue-600 hover:text-white transition-all duration-200 mb-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-white/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold text-[15px]">{dept.name}</span>
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-blue-100 uppercase">DEPARTMENT</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data?.projects?.length > 0 && (
              <Command.Group heading="Projects" className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wider">
                {data.projects.map((proj: any) => (
                  <Command.Item
                    key={proj.id}
                    value={proj.name}
                    onSelect={() => onSelect(`${basePath}/projects/${proj.id}`)}
                    className="group relative flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none hover:bg-blue-600 hover:text-white transition-all duration-200 mb-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-white/20">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold text-[15px]">{proj.name}</span>
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-blue-100 uppercase">PROJECT</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
            {data?.attendance?.length > 0 && (
              <Command.Group heading="Attendance Records" className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wider">
                {data.attendance.map((att: any) => (
                  <Command.Item
                    key={att.id}
                    value={att.user.name}
                    onSelect={() => onSelect(`${basePath}/attendance`)}
                    className="group relative flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none hover:bg-blue-600 hover:text-white transition-all duration-200 mb-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-white/20">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                      <span className="font-semibold text-[15px]">{att.user.name}</span>
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-blue-100 uppercase">{new Date(att.date).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Default Quick Links */}
            <Command.Group heading="Quick Links" className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 tracking-wider">
              {[
                { label: "Dashboard", href: "", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE"], subtitle: "DASHBOARD" },
                { label: "Employees", href: "/employees", icon: Users, roles: ["ADMIN", "HR"], subtitle: "TEAM" },
                { label: "Attendance Overview", href: "/attendance", icon: Clock, roles: ["ADMIN", "HR", "EMPLOYEE"], subtitle: "ATTENDANCE" },
                { label: "QR Generator", href: "/qr-scanner", icon: QrCode, roles: ["ADMIN", "HR"], subtitle: "ATTENDANCE" },
                { label: "Leave Requests", href: "/leaves", icon: Calendar, roles: ["ADMIN", "HR", "EMPLOYEE"], subtitle: "LEAVES" },
                { label: "Project Management", href: "/projects", icon: Briefcase, roles: ["ADMIN", "HR", "EMPLOYEE"], subtitle: "PROJECTS" },
                { label: "Payroll Processing", href: "/payroll", icon: DollarSign, roles: ["ADMIN", "HR"], subtitle: "FINANCE" },
                { label: "My Salary", href: "/salary", icon: Wallet, roles: ["EMPLOYEE"], subtitle: "FINANCE" },
                { label: "Work Reports", href: "/work-reports", icon: Briefcase, roles: ["ADMIN", "HR", "EMPLOYEE"], subtitle: "PRODUCTIVITY" },
                { label: "System Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"], subtitle: "CONFIGURATION" },
              ]
              .filter(link => link.roles.includes(userRole))
              .map((link) => (
                <Command.Item
                  key={link.label}
                  value={link.label}
                  onSelect={() => onSelect(`${basePath}${link.href}`)}
                  className="group relative flex cursor-pointer select-none items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none hover:bg-blue-600 hover:text-white transition-all duration-200 mb-1"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-white/20">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col flex-1 text-left">
                    <span className="font-semibold text-[15px]">{link.label}</span>
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-blue-100 uppercase">{link.subtitle}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Command.Item>
              ))}
            </Command.Group>

          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/40 px-5 py-3 text-xs text-muted-foreground bg-muted/10">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2 font-medium"><kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono text-[10px] font-bold">ENTER</kbd> TO SELECT</span>
              <span className="flex items-center gap-2 font-medium"><kbd className="px-2 py-1 rounded bg-muted border border-border/50 font-mono text-[10px] font-bold">↑↓</kbd> TO NAVIGATE</span>
            </div>
            <div className="font-bold tracking-widest text-[10px] flex items-center gap-1.5 opacity-60">
              <span className="text-[12px]">⌘</span> ATTENDIQ SEARCH
            </div>
          </div>

        </Command>
          </div>
        </div>
      )}
    </>
  );
}
