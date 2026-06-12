import { Metadata } from "next";
import BuyPlanClient from "@/components/marketing/buy-plan-client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Buy Plan | AttendIQ",
  description: "Purchase a premium plan for your organization",
};

export default async function BuyPlanPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { name: { not: "FREE" } },
    orderBy: { priceMonthly: "asc" },
  });

  return (
    <div className="min-h-screen bg-muted/30 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground">Complete Your Purchase</h1>
          <p className="text-muted-foreground mt-2">Setup your organization and select a plan</p>
        </div>
        <BuyPlanClient plans={plans} />
      </div>
    </div>
  );
}
