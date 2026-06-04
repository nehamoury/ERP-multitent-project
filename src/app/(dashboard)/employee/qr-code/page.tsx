// src/app/(dashboard)/employee/qr-code/page.tsx
import { Metadata } from "next";
import { QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import { getAuth } from "@/lib/auth";
import EmployeeQRClient from "@/components/qr/employee-qr-client";

export const metadata: Metadata = { title: "My QR Code" };

export default async function EmployeeQRPage() {
  const session = await getAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="My QR Code"
        description="Show this QR code to HR or Admin for quick check-in/check-out"
        icon={QrCode}
      />
      <EmployeeQRClient userId={session?.user.id || ""} employeeName={session?.user.name || ""} />
    </div>
  );
}
