// src/app/(dashboard)/admin/leaves/page.tsx
import { Metadata } from "next";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import LeavesClient from "@/components/leaves/leaves-client";

export const metadata: Metadata = { title: "Leave Management" };

export default function AdminLeavesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Manage and approve employee leave requests"
        icon={Calendar}
      />
      <LeavesClient isAdmin />
    </div>
  );
}
