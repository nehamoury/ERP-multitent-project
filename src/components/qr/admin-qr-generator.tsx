"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import QRCode from "react-qr-code";

export default function AdminQRGeneratorClient() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrValue, setQrValue] = useState("attendiq-checkin-placeholder");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Generate a new QR value to simulate refresh
          setQrValue(`attendiq-checkin-${Date.now()}`);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
      <p className="text-muted-foreground">
        Employees can scan this code to check in. The code changes automatically.
      </p>

      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-sm font-medium">
        <Clock size={16} />
        Refreshes in {timeLeft}s
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-muted">
        <QRCode
          value={qrValue}
          size={250}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="H"
        />
      </div>
    </div>
  );
}
