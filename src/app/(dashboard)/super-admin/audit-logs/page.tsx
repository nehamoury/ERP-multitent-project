import AuditLogsClient from "@/components/super-admin/audit-logs-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs | Super Admin",
  description: "View global audit logs across the platform.",
};

export default function SuperAdminAuditLogsPage() {
  return <AuditLogsClient />;
}
