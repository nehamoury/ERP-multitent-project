import SettingsClient from "@/components/super-admin/settings-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Settings | Super Admin",
  description: "Global system configuration for AttendiQ.",
};

export default function SuperAdminSettingsPage() {
  return <SettingsClient />;
}
