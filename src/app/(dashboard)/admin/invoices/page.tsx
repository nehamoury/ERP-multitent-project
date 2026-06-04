import { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import InvoicesClient from "@/components/invoices/invoices-client";

export const metadata: Metadata = { title: "Invoices – Admin" };

export default function AdminInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Client Invoices" description="Manage client invoices and payments" icon={FileText} />
      <InvoicesClient isAdmin />
    </div>
  );
}
