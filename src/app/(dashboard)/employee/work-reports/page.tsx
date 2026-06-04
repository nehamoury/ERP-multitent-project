import { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import WorkReportsClient from "@/components/work-reports/work-reports-client";

export const metadata: Metadata = { title: "My Work Reports – Employee" };

export default function EmployeeWorkReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Work Reports" 
        description="Submit your daily work reports and track your tasks" 
        icon={ClipboardList} 
      />
      <WorkReportsClient />
    </div>
  );
}
