import NotificationsClient from "@/components/super-admin/notifications-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Notifications | Super Admin",
  description: "Send system-wide broadcasts.",
};

export default function SuperAdminNotificationsPage() {
  return <NotificationsClient />;
}
