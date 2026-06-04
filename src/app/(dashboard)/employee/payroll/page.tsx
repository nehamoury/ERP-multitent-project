import { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import PayrollClient from "@/components/payroll/payroll-client";

export const metadata: Metadata = { title: "My Payroll" };

export default function EmployeePayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Payroll" description="View your salary records" icon={DollarSign} />
      <PayrollClient />
    </div>
  );
}
