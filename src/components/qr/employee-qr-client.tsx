// src/components/qr/employee-qr-client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, RefreshCw, Download, Loader2, Info, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  userId: string;
  employeeName: string;
}

export default function EmployeeQRClient({ userId, employeeName }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [brightness, setBrightness] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const generateQR = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/qr/generate?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrDataUrl(data.qrDataUrl);
      setGeneratedAt(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
  }, [userId]);

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${employeeName.replace(/\s+/g, "_")}_QR_AttendIQ.png`;
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main QR Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <QrCode size={22} />
            <span className="font-display font-bold text-lg">My Attendance QR</span>
          </div>
          <p className="text-blue-100 text-sm">Show this to HR/Admin for instant check-in</p>
        </div>

        {/* QR display */}
        <div
          ref={qrRef}
          className={cn(
            "flex flex-col items-center justify-center p-8 transition-all duration-300",
            brightness && "bg-white"
          )}
          style={{ minHeight: 340 }}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Generating your QR code…</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center text-red-500">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode size={28} />
              </div>
              <p className="font-medium mb-1">Failed to generate QR</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={generateQR}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {qrDataUrl && !loading && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              {/* QR Image */}
              <div className={cn("p-4 rounded-2xl border-2", brightness ? "bg-white border-gray-200" : "bg-white border-border")}>
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  style={{ width: 220, height: 220, display: "block" }}
                  draggable={false}
                />
              </div>

              {/* Employee name and ID */}
              <div className="text-center">
                <div className="font-display font-bold text-xl">{employeeName}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {generatedAt && `Generated at ${format(generatedAt, "hh:mm:ss a")}`}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={generateQR}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
                >
                  <RefreshCw size={14} />
                  Refresh QR
                </button>
                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download size={14} />
                  Download QR
                </button>
                <button
                  onClick={() => setBrightness(!brightness)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    brightness
                      ? "bg-amber-500 text-white"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  )}
                  title="Increase screen brightness for easier scanning"
                >
                  ☀️ Brightness Mode
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Clock,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            title: "When to use",
            desc: "Show this QR to the HR scanner when arriving or leaving the office.",
          },
          {
            icon: Shield,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            title: "Secure & Signed",
            desc: "Your QR is cryptographically signed. It cannot be forged or reused maliciously.",
          },
          {
            icon: RefreshCw,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            title: "Refresh Anytime",
            desc: "Tap 'Refresh QR' to generate a fresh code. Old codes expire after 24 hours.",
          },
        ].map((card) => (
          <div key={card.title} className="bg-card border border-border rounded-xl p-4">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", card.bg)}>
              <card.icon size={18} className={card.color} />
            </div>
            <div className="font-semibold text-sm mb-1">{card.title}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary mb-1">Tips for best scanning</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Increase your phone's screen brightness (use Brightness Mode button above)</li>
              <li>• Hold the phone steady and flat toward the scanner camera</li>
              <li>• Ensure good lighting — avoid direct sunlight glare on screen</li>
              <li>• Keep 15–30 cm distance from the scanner camera</li>
              <li>• If scan fails, refresh the QR code and try again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
