"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpgradeBanner() {
  const { data: session } = useSession();

  if (!session?.user?.subscription) return null;

  const { status, planName } = session.user.subscription as any;

  if (status === "ACTIVE" && planName !== "FREE") return null;

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div className={cn(
      "px-4 py-2.5 flex items-center justify-between text-sm border-b",
      status === "EXPIRED" 
        ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/50"
        : "bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 dark:from-indigo-950/30 dark:via-blue-900/20 dark:to-emerald-950/30 text-indigo-800 dark:text-indigo-200 border-indigo-100 dark:border-indigo-900/50"
    )}>
      <div className="flex items-center gap-2 font-medium">
        <Zap className={cn("h-4 w-4", status === "EXPIRED" ? "text-red-500" : "text-indigo-500")} />
        {status === "EXPIRED" ? (
          <span>Your subscription has expired. You are in read-only mode.</span>
        ) : (
          <span>You are currently on the <span className="font-bold">{planName}</span> plan. Upgrade to unlock premium HRMS features!</span>
        )}
      </div>
      {isAdmin && (
        <Link 
          href="/admin/billing" 
          className={cn(
            "font-semibold px-3 py-1 rounded-full transition-colors text-xs uppercase tracking-wider",
            status === "EXPIRED"
              ? "bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-800 dark:text-red-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          )}
        >
          Upgrade Now
        </Link>
      )}
    </div>
  );
}
