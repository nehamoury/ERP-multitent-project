// src/app/(dashboard)/admin/employees/page.tsx
import { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const EmployeesClient = dynamic(() => import("@/components/employees/employees-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});
export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Manage all employees, roles, and departments"
        icon={Users}
      />
      <EmployeesClient />
    </div>
  );
}
