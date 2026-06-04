import AnalyticsClient from "@/components/super-admin/analytics-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Super Admin",
  description: "View platform growth and analytics.",
};

export default function SuperAdminAnalyticsPage() {
  return <AnalyticsClient />;
}
