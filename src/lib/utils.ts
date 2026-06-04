// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, differenceInMinutes } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "dd MMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "hh:mm a");
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const mins = differenceInMinutes(checkOut, checkIn);
  return Math.max(0, parseFloat((mins / 60).toFixed(2)));
}

export function isLateCheckIn(checkInTime: Date, shiftStart = "09:00", thresholdMinutes = 15): boolean {
  const [h, m] = shiftStart.split(":").map(Number);
  const shiftStartDate = new Date(checkInTime);
  shiftStartDate.setHours(h, m + thresholdMinutes, 0, 0);
  return checkInTime > shiftStartDate;
}

export function getLateMinutes(checkInTime: Date, shiftStart = "09:00"): number {
  const [h, m] = shiftStart.split(":").map(Number);
  const shiftStartDate = new Date(checkInTime);
  shiftStartDate.setHours(h, m, 0, 0);
  const diff = differenceInMinutes(checkInTime, shiftStartDate);
  return Math.max(0, diff);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500",
    "bg-amber-500", "bg-red-500", "bg-cyan-500", "bg-orange-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    PRESENT: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    LATE: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    ABSENT: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    HALF_DAY: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    WORK_FROM_HOME: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    ON_LEAVE: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400",
    PENDING: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    APPROVED: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    REJECTED: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    CANCELLED: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400",
    ACTIVE: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    INACTIVE: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  };
  return map[status] ?? "text-gray-600 bg-gray-100";
}

export function getRoleBadge(role: string) {
  const map: Record<string, string> = {
    ADMIN: "text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300",
    HR: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
    EMPLOYEE: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  };
  return map[role] ?? "text-gray-700 bg-gray-100";
}

export function getNoticeTypeColor(type: string) {
  const map: Record<string, string> = {
    INFO: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    WARNING: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    URGENT: "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    SUCCESS: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  };
  return map[type] ?? "text-gray-700 bg-gray-50 border-gray-200";
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/super-admin";
    case "ADMIN": return "/admin";
    case "HR": return "/hr";
    default: return "/employee";
  }
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getMonthName(month: number): string {
  return MONTHS[month];
}

export async function logActivity(userId: string, vendorId: string, action: string, description: string, metadata?: object) {
  const { default: prisma } = await import("./prisma");
  return prisma.activityLog.create({
    data: { userId, vendorId, action, description, metadata },
  }).catch(() => null);
}

export async function logAudit(
  actorId: string,
  vendorId: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  oldValues?: object,
  newValues?: object,
) {
  const { default: prisma } = await import("./prisma");
  return prisma.auditLog.create({
    data: {
      actorId,
      vendorId,
      action: action as any,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
    },
  }).catch(() => null);
}
