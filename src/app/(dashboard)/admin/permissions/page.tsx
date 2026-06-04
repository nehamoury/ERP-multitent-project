import { Metadata } from "next";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import PermissionsClient from "@/components/permissions/permissions-client";

export const metadata: Metadata = { title: "Role Permissions – Admin" };

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Role Permissions" description="Configure role-based access control for all modules" icon={Lock} />
      <PermissionsClient />
    </div>
  );
}
