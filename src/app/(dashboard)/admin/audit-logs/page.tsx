// src/app/(dashboard)/admin/audit-logs/page.tsx
import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import AuditLogsClient from "@/components/audit/audit-logs-client";

export const metadata: Metadata = { title: "Audit Logs" };

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Complete audit trail of all system actions"
        icon={ShieldCheck}
      />
      <AuditLogsClient />
    </div>
  );
}
