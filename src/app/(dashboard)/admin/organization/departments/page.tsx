import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DepartmentsClient = dynamic(() => import("@/components/organization/departments-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Departments - Organization" };

export default async function DepartmentsPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const departments = await prisma.department.findMany({
    where: { vendorId: session.user.vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { teams: true, designations: true, users: true } },
      head: { select: { id: true, name: true } }
    }
  });

  const users = await prisma.user.findMany({
    where: { vendorId: session.user.vendorId, isActive: true },
    select: { id: true, name: true, employeeId: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Departments</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization's business units.
        </p>
      </div>

      <DepartmentsClient initialData={departments} users={users} />
    </div>
  );
}
