// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import ImpersonationBanner from "@/components/super-admin/impersonation-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ImpersonationBanner />
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
