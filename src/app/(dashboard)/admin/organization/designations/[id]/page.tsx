import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const DesignationDashboardClient = dynamic<{ designation: any }>(() => import("@/components/organization/designation-dashboard-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Designation Details - AttendIQ" };

export default async function DesignationDashboardPage({ params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return null;

  const designation = await prisma.designation.findUnique({
    where: { id: params.id, vendorId: session.user.vendorId },
    include: {
      department: {
        select: { id: true, name: true }
      },
      users: {
        where: { isActive: true },
        select: {
          id: true, name: true, employeeId: true, role: true, profileImage: true,
          team: { select: { name: true } }
        }
      }
    }
  });

  if (!designation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organization/designations" className="p-2 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">{designation.name}</h1>
            {designation.level && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground border border-border">
                {designation.level}
              </span>
            )}
            {!designation.isActive && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                Inactive
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Designation Details
            {designation.department && (
              <>
                <span>•</span>
                <span>{designation.department.name}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <DesignationDashboardClient designation={designation} />
    </div>
  );
}
