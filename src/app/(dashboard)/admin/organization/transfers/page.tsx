import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import prisma from "@/lib/prisma";

const TransfersClient = dynamic<{ employees: any[], branches: any[], departments: any[], teams: any[] }>(() => import("@/components/organization/transfers-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Employee Transfers - AttendIQ" };

export default async function TransfersPage() {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) return null;

  // Prefetch data for the transfer modal options
  const [employees, branches, departments, teams] = await Promise.all([
    prisma.user.findMany({ 
      where: { vendorId: session.user.vendorId, isActive: true },
      select: { id: true, name: true, employeeId: true, branchId: true, departmentId: true, teamId: true }
    }),
    prisma.branch.findMany({ where: { vendorId: session.user.vendorId, isActive: true }, select: { id: true, name: true } }),
    prisma.department.findMany({ where: { vendorId: session.user.vendorId, isActive: true }, select: { id: true, name: true } }),
    prisma.team.findMany({ where: { vendorId: session.user.vendorId, isActive: true }, select: { id: true, name: true, departmentId: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Employee Transfers</h1>
        <p className="text-muted-foreground mt-1">
          Manage employee movements across branches, departments, and teams.
        </p>
      </div>

      <TransfersClient 
        employees={employees} 
        branches={branches} 
        departments={departments} 
        teams={teams} 
      />
    </div>
  );
}
