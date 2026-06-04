"use client";

import { useSession } from "next-auth/react";
import { LogOut, AlertTriangle } from "lucide-react";

export default function ImpersonationBanner() {
  const { data: session, update } = useSession();

  // @ts-ignore
  if (!session?.user?.isImpersonating) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between z-50 text-sm font-medium shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>You are currently impersonating a vendor account. Any changes made will reflect on their live data.</span>
      </div>
      <button 
        onClick={async () => {
          await update({ revertImpersonation: true });
          window.location.href = '/super-admin';
        }}
        className="flex items-center gap-2 bg-amber-950/10 hover:bg-amber-950/20 px-3 py-1 rounded-lg transition-colors"
      >
        <LogOut size={14} />
        Return to Super Admin
      </button>
    </div>
  );
}
