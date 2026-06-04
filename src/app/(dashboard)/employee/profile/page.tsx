import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import MyProfileClient from "@/components/employees/my-profile-client";

export const metadata: Metadata = { title: "My Profile | AttendIQ" };

export default async function ProfilePage() {
  const session = await getAuth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, employeeId: true, role: true,
      fathersName: true, address: true, linkedInUrl: true, gender: true,
      dateOfBirth: true, joinDate: true, shiftStart: true, shiftEnd: true, isActive: true,
      profileImage: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      branch: { select: { name: true } },
      team: { select: { name: true } },
      reportingManager: { select: { name: true, email: true } },
    },
  });

  if (!user) return null;

  return (
    <MyProfileClient user={{
      ...user,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      joinDate: user.joinDate.toISOString(),
      department: user.department?.name || null,
      designation: user.designation?.name || null,
      branch: user.branch?.name || null,
      team: user.team?.name || null,
      reportingManager: user.reportingManager?.name || null,
      reportingManagerEmail: user.reportingManager?.email || null,
    }} />
  );
}
