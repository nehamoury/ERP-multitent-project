import VendorsClient from "@/components/super-admin/vendors-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Vendors Management - AttendIQ Super Admin",
};

export default async function VendorsPage() {
  const session = await getAuth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <VendorsClient />;
}
