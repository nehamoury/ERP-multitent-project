import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const BranchesClient = dynamic(() => import("@/components/organization/branches-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Branches - Organization" };

export default async function BranchesPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const branches = await prisma.branch.findMany({
    where: { vendorId: session.user.vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
      manager: { select: { id: true, name: true } }
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
        <h1 className="text-2xl font-display font-bold">Branches</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization's office locations.
        </p>
      </div>

      <BranchesClient initialData={branches} users={users} />
    </div>
  );
}
