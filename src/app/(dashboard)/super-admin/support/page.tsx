import SupportClient from "@/components/super-admin/support-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Tickets | Super Admin",
  description: "Manage and resolve vendor support tickets.",
};

export default function SuperAdminSupportPage() {
  return <SupportClient />;
}
