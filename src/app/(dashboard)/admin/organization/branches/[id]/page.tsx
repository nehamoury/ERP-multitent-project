import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const BranchDetailsClient = dynamic(() => import("@/components/organization/branch-details-client"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Branch Details - Organization" };

export default async function BranchDetailsPage({ params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return redirect("/");

  const branch = await prisma.branch.findUnique({
    where: { id: params.id, vendorId: session.user.vendorId },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { users: true, departments: true, teams: true } },
      departments: {
        select: { id: true, name: true, _count: { select: { users: true } } }
      },
      teams: {
        select: { id: true, name: true, _count: { select: { users: true } } }
      }
    }
  });

  if (!branch) return notFound();

  // Compute dummy project count for now
  const branchData = {
    ...branch,
    _count: {
      ...branch._count,
      projects: 0
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Branch Details: {branch.name}</h1>
        <p className="text-muted-foreground mt-1">
          View analytics, departments, and teams for this branch.
        </p>
      </div>

      <BranchDetailsClient initialData={branchData} />
    </div>
  );
}
