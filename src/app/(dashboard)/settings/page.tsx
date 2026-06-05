import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AccountSettingsClient from "@/components/settings/account-settings-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Account Settings | AttendIQ" };

export default async function SettingsPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true,
      vendor: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <AccountSettingsClient user={{
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: user.vendor.name
    }} />
  );
}
