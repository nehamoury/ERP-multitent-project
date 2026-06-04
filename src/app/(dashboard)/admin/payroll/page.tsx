import { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import PayrollClient from "@/components/payroll/payroll-client";

export const metadata: Metadata = { title: "Payroll – Admin" };

export default function AdminPayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll Management" description="Manage employee salaries and payments" icon={DollarSign} />
      <PayrollClient isAdmin />
    </div>
  );
}
