// src/app/(dashboard)/admin/qr-scanner/page.tsx
import { Metadata } from "next";
import { QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import QRScannerClient from "@/components/qr/qr-scanner-client";

export const metadata: Metadata = { title: "QR Scanner – Admin" };

export default function AdminQRScannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code Scanner"
        description="Scan employee QR codes for instant check-in and check-out"
        icon={QrCode}
      />
      <QRScannerClient />
    </div>
  );
}
