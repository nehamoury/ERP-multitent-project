import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import prisma from "@/lib/prisma";

const PromotionsClient = dynamic<{ employees: any[], designations: any[] }>(() => import("@/components/organization/promotions-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Employee Promotions - AttendIQ" };

export default async function PromotionsPage() {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) return null;

  // Prefetch data for the promotion modal options
  const [employees, designations] = await Promise.all([
    prisma.user.findMany({ 
      where: { vendorId: session.user.vendorId, isActive: true },
      select: { id: true, name: true, employeeId: true, designationId: true }
    }),
    prisma.designation.findMany({ where: { vendorId: session.user.vendorId, isActive: true }, select: { id: true, name: true } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Employee Promotions</h1>
        <p className="text-muted-foreground mt-1">
          Manage employee role upgrades, level changes, and salary revisions.
        </p>
      </div>

      <PromotionsClient 
        employees={employees} 
        designations={designations} 
      />
    </div>
  );
}
