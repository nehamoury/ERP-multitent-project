import SecurityClient from "@/components/super-admin/security-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Center | Super Admin",
  description: "Monitor platform security and authentication events.",
};

export default function SuperAdminSecurityPage() {
  return <SecurityClient />;
}
