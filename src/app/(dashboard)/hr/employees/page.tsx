// src/app/(dashboard)/hr/employees/page.tsx
import { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import EmployeesClient from "@/components/employees/employees-client";

export const metadata: Metadata = { title: "HR - Employees" };

export default function HREmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Manage your vendor's employees, roles, and departments"
        icon={Users}
      />
      <EmployeesClient />
    </div>
  );
}
