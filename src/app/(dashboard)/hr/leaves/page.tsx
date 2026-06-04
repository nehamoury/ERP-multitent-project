// src/app/(dashboard)/hr/leaves/page.tsx
import { Metadata } from "next";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import LeavesClient from "@/components/leaves/leaves-client";

export const metadata: Metadata = { title: "Leaves – HR" };

export default function HRLeavesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leave Requests" description="Manage employee leave approvals" icon={Calendar} />
      <LeavesClient isAdmin />
    </div>
  );
}
