import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OrganizationOverviewClient from "@/components/organization/organization-overview-client";

export const metadata: Metadata = { title: "Organization Overview" };

async function getOrganizationData(vendorId: string) {
  const [
    branchesCount,
    departmentsCount,
    teamsCount,
    designationsCount,
    employeesCount,
    recentBranches,
    recentDepartments,
    recentTeams,
    recentEmployees,
    allDepartments
  ] = await Promise.all([
    prisma.branch.count({ where: { vendorId } }),
    prisma.department.count({ where: { vendorId } }),
    prisma.team.count({ where: { vendorId } }),
    prisma.designation.count({ where: { vendorId } }),
    prisma.user.count({ where: { vendorId, isActive: true, role: { not: "ADMIN" } } }),
    prisma.branch.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.department.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' }, take: 5, include: { _count: { select: { teams: true, designations: true, users: true } } } }),
    prisma.team.findMany({ where: { vendorId }, orderBy: { createdAt: 'desc' }, take: 5, include: { department: { select: { name: true } } } }),
    prisma.user.findMany({ where: { vendorId, role: { not: "ADMIN" } }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, employeeId: true, role: true, department: { select: { name: true } } } }),
    prisma.department.findMany({ where: { vendorId }, include: { teams: true, _count: { select: { users: true } } }, orderBy: { name: 'asc' } })
  ]);

  return {
    stats: {
      branches: branchesCount,
      departments: departmentsCount,
      teams: teamsCount,
      designations: designationsCount,
      employees: employeesCount
    },
    recentBranches,
    recentDepartments,
    recentTeams,
    recentEmployees,
    allDepartments
  };
}

export default async function OrganizationOverviewPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const data = await getOrganizationData(session.user.vendorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Organization Overview</h1>
        <p className="text-muted-foreground mt-1">
          Manage your company structure, branches, and departments.
        </p>
      </div>

      <OrganizationOverviewClient data={data} />
    </div>
  );
}
