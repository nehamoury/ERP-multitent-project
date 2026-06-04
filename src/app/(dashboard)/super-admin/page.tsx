import SuperAdminDashboardClient from "@/components/super-admin/dashboard-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Super Admin Dashboard - AttendIQ",
};

export default async function SuperAdminDashboardPage() {
  const session = await getAuth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <SuperAdminDashboardClient />;
}
