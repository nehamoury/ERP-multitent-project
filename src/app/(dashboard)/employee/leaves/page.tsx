// src/app/(dashboard)/employee/leaves/page.tsx
import { Metadata } from "next";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import LeavesClient from "@/components/leaves/leaves-client";

export const metadata: Metadata = { title: "My Leaves" };

export default function EmployeeLeavesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Leaves" description="Apply for leave and track your requests" icon={Calendar} />
      <LeavesClient isAdmin={false} />
    </div>
  );
}
