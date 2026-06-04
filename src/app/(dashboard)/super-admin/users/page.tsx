import UsersClient from "@/components/super-admin/users-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Super Admin",
  description: "Manage all users across the platform.",
};

export default function SuperAdminUsersPage() {
  return <UsersClient />;
}
