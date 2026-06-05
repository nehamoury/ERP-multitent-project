import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProfileClient from "@/components/profile/profile-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My Profile | AttendIQ" };

export default async function ProfilePage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, employeeId: true, role: true,
      joinDate: true, shiftStart: true, shiftEnd: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      vendor: { select: { name: true, state: true, billingAddress: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <ProfileClient user={{
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      role: user.role,
      joinDate: user.joinDate.toISOString(),
      shiftStart: user.shiftStart,
      shiftEnd: user.shiftEnd,
      department: user.department?.name || null,
      designation: user.designation?.name || null,
      vendor: {
        name: user.vendor.name,
        state: user.vendor.state,
        billingAddress: user.vendor.billingAddress
      }
    }} />
  );
}
