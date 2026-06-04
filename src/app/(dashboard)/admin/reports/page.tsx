// src/app/(dashboard)/admin/reports/page.tsx
import { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import ReportsClient from "@/components/reports/reports-client";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Reports"
        description="Generate, analyze and export attendance reports"
        icon={BarChart3}
      />
      <ReportsClient />
    </div>
  );
}
