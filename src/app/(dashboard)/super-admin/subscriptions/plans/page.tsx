import PlansClient from "@/components/super-admin/plans-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Subscription Plans - AttendIQ Super Admin",
};

export default async function PlansPage() {
  const session = await getAuth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <PlansClient />;
}
