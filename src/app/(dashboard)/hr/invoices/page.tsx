import { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import InvoicesClient from "@/components/invoices/invoices-client";

export const metadata: Metadata = { title: "Invoices – HR" };

export default function HRInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Client Invoices" description="View client invoices" icon={FileText} />
      <InvoicesClient isHR />
    </div>
  );
}
