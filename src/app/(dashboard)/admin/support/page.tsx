import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TicketsClient from "@/components/tickets/tickets-client";
import { PageHeader } from "@/components/ui/shared";

export const metadata: Metadata = { title: "Support Tickets | Admin" };

export default async function AdminTicketsPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Support Tickets" 
        description="Manage employee queries, IT support requests, and other issues."
      />
      <TicketsClient isAdmin={isAdmin} />
    </div>
  );
}
