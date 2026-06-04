import { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import WorkReportsClient from "@/components/work-reports/work-reports-client";

export const metadata: Metadata = { title: "Work Reports – Admin" };

export default function AdminWorkReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Work Reports" description="Review and approve employee work reports" icon={ClipboardList} />
      <WorkReportsClient isAdmin />
    </div>
  );
}
