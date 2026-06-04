import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DesignationsClient = dynamic(() => import("@/components/organization/designations-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Designations - Organization" };

export default async function DesignationsPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const [designations, departments, users] = await Promise.all([
    prisma.designation.findMany({
      where: { vendorId: session.user.vendorId },
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { users: true } }
      }
    }),
    prisma.department.findMany({
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
        <h1 className="text-2xl font-display font-bold">Designations</h1>
        <p className="text-muted-foreground mt-1">
          Manage job titles and roles within your departments.
        </p>
      </div>

      <DesignationsClient initialData={designations} departments={departments} users={users} />
    </div>
  );
}
