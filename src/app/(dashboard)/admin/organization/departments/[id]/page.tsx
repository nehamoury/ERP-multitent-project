import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const DepartmentDashboardClient = dynamic<{ department: any }>(() => import("@/components/organization/department-dashboard-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Department Dashboard - AttendIQ" };

export default async function DepartmentDashboardPage({ params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) return null;

  const department = await prisma.department.findUnique({
    where: { id: params.id, vendorId: session.user.vendorId },
    include: {
      head: {
        select: { id: true, name: true, employeeId: true, email: true, profileImage: true }
      },
      teams: {
        orderBy: { name: 'asc' },
        include: {
          lead: { select: { id: true, name: true } },
          _count: { select: { users: true } }
        }
      },
      users: {
        where: { isActive: true },
        select: {
          id: true, name: true, employeeId: true, role: true, designation: { select: { name: true } },
          team: { select: { name: true } }, profileImage: true
        }
      }
    }
  });

  if (!department) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organization/departments" className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">{department.name}</h1>
          <p className="text-muted-foreground mt-1">
            {department.code ? `Code: ${department.code}` : "Department Dashboard"}
          </p>
        </div>
      </div>

      <DepartmentDashboardClient department={department} />
    </div>
  );
}
