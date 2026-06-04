// src/app/page.tsx
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";

export default async function RootPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");
  redirect(getDashboardPath(session.user.role));
}
