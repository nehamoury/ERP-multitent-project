// src/app/(dashboard)/admin/settings/page.tsx
import { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import SettingsClient from "@/components/settings/settings-client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await prisma.companySettings.findFirst();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Settings"
        description="Configure shift times, policies, and preferences"
        icon={Settings}
      />
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
