import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TeamsClient = dynamic(() => import("@/components/organization/teams-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Teams - Organization" };

export default async function TeamsPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const [teams, departments, branches, users] = await Promise.all([
    prisma.team.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { users: true } },
        lead: { select: { id: true, name: true } }
      }
    }),
    prisma.department.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, branchId: true }
    }),
    prisma.branch.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      where: { vendorId: session.user.vendorId, isActive: true },
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Teams</h1>
        <p className="text-muted-foreground mt-1">
          Manage operational teams within your departments.
        </p>
      </div>

      <TeamsClient initialData={teams} departments={departments} branches={branches} users={users} />
    </div>
  );
}
