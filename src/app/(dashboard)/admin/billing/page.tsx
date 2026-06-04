import { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import BillingClient from "@/components/billing/billing-client";

export const metadata: Metadata = { title: "Billing & Subscription" };

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your SaaS plan, limits, and invoices"
        icon={CreditCard}
      />
      <BillingClient />
    </div>
  );
}
