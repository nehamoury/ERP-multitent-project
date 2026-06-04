import VendorDetailsClient from "@/components/super-admin/vendor-details-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Vendor Details - AttendIQ Super Admin",
};

export default async function VendorDetailsPage({ params }: { params: { id: string } }) {
  const session = await getAuth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <VendorDetailsClient vendorId={params.id} />;
}
