import RevenueClient from "@/components/super-admin/revenue-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Revenue Dashboard - AttendIQ Super Admin",
};

export default async function RevenuePage() {
  const session = await getAuth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <RevenueClient />;
}
