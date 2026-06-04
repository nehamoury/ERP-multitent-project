import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const HierarchyClient = dynamic<{}>(() => import("@/components/organization/hierarchy-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Organization Hierarchy - AttendIQ" };

export default async function HierarchyPage() {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Organization Tree</h1>
        <p className="text-muted-foreground mt-1">
          Visual representation of your company's structure.
        </p>
      </div>

      <HierarchyClient />
    </div>
  );
}
