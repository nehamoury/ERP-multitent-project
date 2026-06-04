import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TeamDashboardClient = dynamic<{ team: any, chatRoomId?: string }>(() => import("@/components/organization/team-dashboard-client"), { 
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
      department: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
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

  // Fetch projects assigned to this team
  const projects = await prisma.project.findMany({
    where: { teamId: team.id, vendorId: session.user.vendorId },
    select: { id: true, name: true, status: true, _count: { select: { tasks: true } } }
  });

  // Since we haven't implemented tasks or attendance fully, we will pass empty arrays or placeholders
  // We can fetch the team's chatroom
  const chatRoom = await prisma.chatRoom.findFirst({
    where: { teamId: team.id, vendorId: session.user.vendorId }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organization/teams" className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">{team.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{team.code || 'NO-CODE'}</span>
            <span>{team.department.name}</span>
            {team.branch && <span>• {team.branch.name}</span>}
          </p>
        </div>
      </div>

      <TeamDashboardClient team={{...team, projects}} chatRoomId={chatRoom?.id} />
    </div>
  );
}
