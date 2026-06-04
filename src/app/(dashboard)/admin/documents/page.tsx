import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DocumentsClient from "@/components/documents/documents-client";
import { PageHeader } from "@/components/ui/shared";

export const metadata: Metadata = { title: "Documents | Admin" };

export default async function AdminDocumentsPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documents" 
        description="Manage company policies, handbooks, and general documents."
      />
      <DocumentsClient isAdmin={isAdmin} />
    </div>
  );
}
