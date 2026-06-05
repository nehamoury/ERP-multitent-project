import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HelpSupportClient from "@/components/support/help-support-client";

export const metadata: Metadata = { title: "Help & Support | AttendIQ" };

export default async function HelpSupportPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      vendor: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <HelpSupportClient />
  );
}
