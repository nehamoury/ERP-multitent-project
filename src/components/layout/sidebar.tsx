// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, Calendar, BarChart3,
  FileText, Settings, ShieldCheck, ClipboardList, LogOut, ChevronLeft, ChevronRight, QrCode,
  Megaphone, Briefcase, CreditCard, Lock, DollarSign, Building2, ChevronDown,
  Wallet, UserCircle, PartyPopper, Headphones, FolderOpen
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  feature?: string;
  badge?: string;
  subItems?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  // Super Admin Navigation
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
  { 
    label: "Vendor Management", 
    href: "/super-admin/vendors", 
    icon: Building2, 
    roles: ["SUPER_ADMIN"],
    subItems: [
      { label: "All Vendors", href: "/super-admin/vendors" },
    ]
  },
  { 
    label: "Subscriptions", 
    href: "/super-admin/subscriptions/plans", 
    icon: CreditCard, 
    roles: ["SUPER_ADMIN"],
    subItems: [
      { label: "Plans", href: "/super-admin/subscriptions/plans" },
    ]
  },
  { label: "Revenue", href: "/super-admin/revenue", icon: DollarSign, roles: ["SUPER_ADMIN"] },
  { label: "User Management", href: "/super-admin/users", icon: Users, roles: ["SUPER_ADMIN"] },
  { label: "Notifications", href: "/super-admin/notifications", icon: Megaphone, roles: ["SUPER_ADMIN"] },
  { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3, roles: ["SUPER_ADMIN"] },
  { label: "System Settings", href: "/super-admin/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
  { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ClipboardList, roles: ["SUPER_ADMIN"] },
  { label: "Support Tickets", href: "/super-admin/support", icon: FileText, roles: ["SUPER_ADMIN"] },
  { label: "Security Center", href: "/super-admin/security", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },

  // ── Admin Navigation ─────────────────────────────────────────────────────
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { label: "Dashboard", href: "/hr", icon: LayoutDashboard, roles: ["HR"] },
  { 
    label: "Organization", 
    href: "/admin/organization", 
    icon: Building2, 
    roles: ["ADMIN"], 
    subItems: [
      { label: "Overview", href: "/admin/organization" },
      { label: "Branches", href: "/admin/organization/branches" },
      { label: "Departments", href: "/admin/organization/departments" },
      { label: "Teams", href: "/admin/organization/teams" },
      { label: "Designations", href: "/admin/organization/designations" },
      { label: "Hierarchy", href: "/admin/organization/hierarchy" },
      { label: "Transfers", href: "/admin/organization/transfers" },
      { label: "Promotions", href: "/admin/organization/promotions" },
    ]
  },
  { label: "Employees", href: "/admin/employees", icon: Users, roles: ["ADMIN"] },
  { label: "Employees", href: "/hr/employees", icon: Users, roles: ["HR"] },
  { label: "Notice Board", href: "/admin/notices", icon: Megaphone, roles: ["ADMIN"] },
  { label: "Notice Board", href: "/hr/notices", icon: Megaphone, roles: ["HR"] },
  { label: "Projects & Tasks", href: "/admin/projects", icon: Briefcase, roles: ["ADMIN"], feature: "Projects" },
  { label: "Projects & Tasks", href: "/hr/projects", icon: Briefcase, roles: ["HR"], feature: "Projects" },
  { label: "Attendance", href: "/admin/attendance", icon: Clock, roles: ["ADMIN"], feature: "Attendance" },
  { label: "Attendance", href: "/hr/attendance", icon: Clock, roles: ["HR"], feature: "Attendance" },
  { label: "Leaves", href: "/admin/leaves", icon: Calendar, roles: ["ADMIN"], feature: "Leave Management" },
  { label: "Leaves", href: "/hr/leaves", icon: Calendar, roles: ["HR"], feature: "Leave Management" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["ADMIN"], feature: "Reports" },
  { label: "Reports", href: "/hr/reports", icon: BarChart3, roles: ["HR"], feature: "Reports" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck, roles: ["ADMIN"] },
  { label: "Billing", href: "/admin/billing", icon: CreditCard, roles: ["ADMIN"] },
  { label: "Payroll", href: "/admin/payroll", icon: DollarSign, roles: ["ADMIN"], feature: "Payroll" },
  { label: "Payroll", href: "/hr/payroll", icon: DollarSign, roles: ["HR"], feature: "Payroll" },
  { label: "Invoices", href: "/admin/invoices", icon: FileText, roles: ["ADMIN"], feature: "Invoices" },
  { label: "Invoices", href: "/hr/invoices", icon: FileText, roles: ["HR"], feature: "Invoices" },
  { label: "Work Reports", href: "/admin/work-reports", icon: ClipboardList, roles: ["ADMIN"] },
  { label: "Work Reports", href: "/hr/work-reports", icon: ClipboardList, roles: ["HR"] },
  { label: "Recruitment", href: "/admin/recruitment", icon: Users, roles: ["ADMIN"], feature: "Recruitment" },
  { label: "Assets", href: "/admin/assets", icon: LayoutDashboard, roles: ["ADMIN"], feature: "Assets" },
  { label: "Documents", href: "/admin/documents", icon: FolderOpen, roles: ["ADMIN"] },
  { label: "Support Tickets", href: "/admin/support", icon: Headphones, roles: ["ADMIN"] },
  { label: "Permissions", href: "/admin/permissions", icon: Lock, roles: ["ADMIN"] },

  // ── Employee Navigation ───────────────────────────────────────────────────
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard, roles: ["EMPLOYEE"] },
  { label: "My Attendance", href: "/employee/attendance", icon: Clock, roles: ["EMPLOYEE"], feature: "Attendance" },
  { label: "My Leaves", href: "/employee/leaves", icon: Calendar, roles: ["EMPLOYEE"], feature: "Leave Management" },
  { label: "My Payroll", href: "/employee/salary", icon: Wallet, roles: ["EMPLOYEE"] },
  { label: "My Profile", href: "/employee/profile", icon: UserCircle, roles: ["EMPLOYEE"] },
  { label: "Notice Board", href: "/employee/notices", icon: Megaphone, roles: ["EMPLOYEE"] },
  { label: "Holidays", href: "/employee/holidays", icon: PartyPopper, roles: ["EMPLOYEE"] },
  { label: "Documents", href: "/employee/documents", icon: FolderOpen, roles: ["EMPLOYEE"] },
  { label: "My Tasks", href: "/employee/projects", icon: Briefcase, roles: ["EMPLOYEE"], feature: "Projects" },
  { label: "Work Reports", href: "/employee/work-reports", icon: ClipboardList, roles: ["EMPLOYEE"] },
  { label: "Support", href: "/employee/support", icon: Headphones, roles: ["EMPLOYEE"] },
];

// Features that should be shown as locked (greyed out) in sidebar for upsell
const PREMIUM_PREVIEW_ITEMS: NavItem[] = [
  { label: "Leave Management", href: "/admin/leaves", icon: Calendar, roles: ["ADMIN"], feature: "Leave Management" },
  { label: "Projects & Tasks", href: "/admin/projects", icon: Briefcase, roles: ["ADMIN"], feature: "Projects" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["ADMIN"], feature: "Reports" },
];

interface Props {
  user: { name: string; email: string; role: string; department?: string; subscription?: any };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Organization: pathname.includes("/organization")
  });
  const { data: session } = useSession();

  // Use live session subscription (updates when plan upgrades), fallback to prop
  const liveSubscription = session?.user?.subscription ?? user.subscription;
  const vendorFeatures: string[] = Array.isArray(liveSubscription?.features) 
    ? liveSubscription.features 
    : [];
  const currentRole = session?.user?.role ?? user.role;

  const isFeatureEnabled = (feature?: string): boolean => {
    if (!feature) return true;
    if (feature === "Reports" && vendorFeatures.includes("Advanced Reports")) return true;
    return vendorFeatures.includes(feature);
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(currentRole)) return false;
    return isFeatureEnabled(item.feature);
  });

  // Items locked but visible for upsell (only for ADMIN)
  const lockedItems = currentRole === "ADMIN"
    ? PREMIUM_PREVIEW_ITEMS.filter(item => !isFeatureEnabled(item.feature))
    : [];


  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 p-4 border-b border-sidebar-border", collapsed && "justify-center")}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-bold text-lg text-sidebar-foreground leading-none">AttendIQ</div>
            <div className="text-xs text-sidebar-foreground/70 mt-0.5">Workforce CRM</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("ml-auto p-1 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground", collapsed && "ml-0 mt-1")}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 uppercase tracking-wider font-semibold">
            {user.role} Portal
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href.length > 1 && !item.subItems);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isParentActive = hasSubItems && item.subItems!.some(sub => pathname === sub.href || pathname.startsWith(sub.href));
          const isMenuOpen = openMenus[item.label];

          return (
            <div key={item.href} className="flex flex-col">
              {hasSubItems ? (
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    setOpenMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                  }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                    (isParentActive || isMenuOpen)
                      ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon size={18} className={cn("flex-shrink-0", (isParentActive || isMenuOpen) && "text-primary")} />
                  {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {!collapsed && (
                    <ChevronDown size={16} className={cn("transition-transform duration-200", isMenuOpen && "rotate-180")} />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon size={18} className={cn("flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub items rendering */}
              {hasSubItems && isMenuOpen && !collapsed && (
                <div className="flex flex-col mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-1">
                  {item.subItems!.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          isSubActive
                            ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                            : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Locked Premium Items (upsell) */}
        {lockedItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1 px-3">
                <p className="text-[10px] text-blue-400/60 uppercase tracking-widest font-semibold">Upgrade to unlock</p>
              </div>
            )}
            {lockedItems.map((item) => (
              <Link
                key={`locked-${item.href}`}
                href="/admin/billing"
                title={collapsed ? `${item.label} (Upgrade to unlock)` : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 opacity-40 cursor-pointer hover:opacity-60",
                  "text-sidebar-foreground/70",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    <Lock size={12} className="flex-shrink-0 ml-auto" />
                  </>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>


    </aside>
  );
}
