import { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import PayrollClient from "@/components/payroll/payroll-client";

export const metadata: Metadata = { title: "Payroll – HR" };

export default function HRPayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll Management" description="View employee payroll records" icon={DollarSign} />
      <PayrollClient isHR />
    </div>
  );
}
