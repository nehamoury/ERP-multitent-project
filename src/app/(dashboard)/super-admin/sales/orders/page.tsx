import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OrdersClient from "@/components/super-admin/orders-client";

export const metadata: Metadata = {
  title: "Sales Orders | Super Admin",
  description: "View all pending, successful, and failed checkout sessions.",
};

export default async function OrdersPage() {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const orders = await prisma.checkoutSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-foreground">Sales Orders</h1>
        <p className="text-muted-foreground mt-1">Track all SaaS checkouts and abandoned carts.</p>
      </div>

      <OrdersClient orders={orders} />
    </div>
  );
}
