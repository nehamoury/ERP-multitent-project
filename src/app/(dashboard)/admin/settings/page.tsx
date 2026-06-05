import { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import SettingsClient from "@/components/settings/settings-client";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Organization Settings | AttendIQ" };

export default async function SettingsPage() {
  const session = await getAuth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vendorId: true },
  });

  if (!user?.vendorId) redirect("/login");

  let settings = await prisma.companySettings.findUnique({
    where: { vendorId: user.vendorId },
  });

  const vendor = await prisma.vendor.findUnique({
    where: { id: user.vendorId },
    select: { 
      name: true,
      email: true,
      phone: true,
      billingAddress: true,
      gstin: true,
      code: true,
      website: true,
      logo: true,
    },
  });

  // Default fallback if companySettings hasn't been created yet for this vendor
  if (!settings) {
    settings = {
      id: "new",
      vendorId: user.vendorId,
      companyName: vendor?.name || "Acme Corp",
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      gracePeriod: 15,
      lateThreshold: 15,
      halfDayThreshold: 240,
      absentThreshold: 480,
      minimumWorkingHours: 8,
      overtimeEnabled: false,
      timezone: "Asia/Kolkata",
      workingDays: [1, 2, 3, 4, 5] as any,
      halfDaySupport: false,
      updatedAt: new Date(),
    };
  }

  // Merge settings with vendor data
  const resolvedSettings = {
    ...settings,
    companyName: vendor?.name || settings.companyName,
    companyCode: vendor?.code || "",
    companyEmail: vendor?.email || "",
    companyPhone: vendor?.phone || "",
    address: vendor?.billingAddress || "",
    gstNumber: vendor?.gstin || "",
    website: vendor?.website || "",
    companyLogo: vendor?.logo || "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Configure your company's core information, shift times, and attendance policies."
        icon={Settings}
      />
      <SettingsClient initialSettings={resolvedSettings} />
    </div>
  );
}
