import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TeamDashboardClient = dynamic<{ team: any }>(() => import("@/components/organization/team-dashboard-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Team Dashboard - AttendIQ" };

export default async function TeamDashboardPage({ params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) return null;

  const team = await prisma.team.findUnique({
    where: { id: params.id, vendorId: session.user.vendorId },
    include: {
      department: {
        select: { id: true, name: true }
      },
      lead: {
        select: { id: true, name: true, employeeId: true, email: true, profileImage: true }
      },
      users: {
        where: { isActive: true },
        select: {
          id: true, name: true, employeeId: true, role: true, designation: { select: { name: true } },
          profileImage: true
        }
      }
    }
  });

  if (!team) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organization/teams" className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">{team.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Department: <Link href={`/admin/organization/departments/${team.department?.id}`} className="text-primary hover:underline">{team.department?.name}</Link>
          </p>
        </div>
      </div>

      <TeamDashboardClient team={team} />
    </div>
  );
}
