import { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingClient from "@/components/settings/billing-client";

export const metadata: Metadata = { title: "Billing & Subscription | AttendIQ" };

export default async function BillingPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vendorId: true },
  });

  if (!user?.vendorId) redirect("/login");

  const vendor = await prisma.vendor.findUnique({
    where: { id: user.vendorId },
    include: {
      subscription: {
        include: {
          plan: true
        }
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
        include: {
          payments: true
        }
      }
    }
  });

  if (!vendor) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription plan, view invoices, and track payment history."
        icon={CreditCard}
      />
      <BillingClient vendor={vendor} />
    </div>
  );
}
