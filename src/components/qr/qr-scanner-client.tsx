// src/components/qr/qr-scanner-client.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, CameraOff, QrCode, CheckCircle2, XCircle,
  RefreshCw, Clock, LogIn, LogOut, Users, Zap, AlertTriangle, X
} from "lucide-react";
import { cn, formatTime, getInitials, getAvatarColor } from "@/lib/utils";
import { format } from "date-fns";

interface ScanResult {
  success: boolean;
  action?: "checkin" | "checkout";
  employee?: { name: string; employeeId: string; department: any };
  time?: string;
  late?: boolean;
  lateMinutes?: number;
  workingHours?: number;
  error?: string;
}

interface LogEntry {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  action: "checkin" | "checkout";
  time: string;
  late: boolean;
  lateMinutes?: number;
}

export default function QRScannerClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<"auto" | "checkin" | "checkout">("auto");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ checkins: 0, checkouts: 0, late: 0 });
  const [processingQR, setProcessingQR] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
      setScanning(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, [facingMode]);

  // ── Stop camera ─────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setCameraOn(false);
    setScanning(false);
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  // ── QR frame scanning loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraOn || !scanning) return;

    const tick = async () => {
      if (!videoRef.current || !canvasRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { animFrameRef.current = requestAnimationFrame(tick); return; }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Dynamic import jsQR
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        const now = Date.now();
        // Debounce: same QR not processed within 3 seconds
        if (code.data !== lastScanRef.current || now - lastScanTimeRef.current > 3000) {
          lastScanRef.current = code.data;
          lastScanTimeRef.current = now;
          if (!processingQR) {
            await handleQRDetected(code.data);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraOn, scanning, processingQR, mode]);

  // ── Handle detected QR ──────────────────────────────────────────────────────
  const handleQRDetected = async (qrData: string) => {
    setProcessingQR(true);
    // Play beep sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}

    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData, action: mode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const result: ScanResult = {
          success: true,
          action: data.action,
          employee: data.employee,
          time: data.time,
          late: data.late,
          lateMinutes: data.lateMinutes,
          workingHours: data.workingHours,
        };
        setScanResult(result);

        // Add to log
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          employee: data.employee.name,
          employeeId: data.employee.employeeId,
          department: typeof data.employee.department === "object" ? (data.employee.department?.name || "—") : (data.employee.department || "—"),
          action: data.action,
          time: format(new Date(data.time), "hh:mm:ss a"),
          late: !!data.late,
          lateMinutes: data.lateMinutes,
        };
        setRecentLogs((p) => [logEntry, ...p.slice(0, 19)]);
        setStats((s) => ({
          checkins: s.checkins + (data.action === "checkin" ? 1 : 0),
          checkouts: s.checkouts + (data.action === "checkout" ? 1 : 0),
          late: s.late + (data.late ? 1 : 0),
        }));

        setTimeout(() => setScanResult(null), 4000);
      } else {
        setScanResult({ success: false, error: data.error, employee: data.employee });
        setTimeout(() => setScanResult(null), 3000);
      }
    } catch {
      setScanResult({ success: false, error: "Network error. Please try again." });
      setTimeout(() => setScanResult(null), 3000);
    } finally {
      setProcessingQR(false);
    }
  };

  const flipCamera = () => {
    stopCamera();
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
    setTimeout(() => startCamera(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Check-ins Today", value: stats.checkins, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: LogIn },
          { label: "Check-outs Today", value: stats.checkouts, color: "text-blue-500", bg: "bg-blue-500/10", icon: LogOut },
          { label: "Late Arrivals", value: stats.late, color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <div className={cn("text-2xl font-display font-bold tabular-nums", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scanner Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mode selector */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-muted-foreground">Scan Mode:</span>
              {[
                { value: "auto", label: "Auto Detect", icon: Zap, desc: "Smart: auto check-in or check-out" },
                { value: "checkin", label: "Check In Only", icon: LogIn, desc: "Force check-in" },
                { value: "checkout", label: "Check Out Only", icon: LogOut, desc: "Force check-out" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value as any)}
                  title={m.desc}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    mode === m.value
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <m.icon size={15} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Box */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="relative bg-black" style={{ aspectRatio: "16/10" }}>
              {/* Video feed */}
              <video
                ref={videoRef}
                className={cn("w-full h-full object-cover", !cameraOn && "hidden")}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Placeholder when camera is off */}
              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <QrCode size={40} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">QR Scanner Ready</p>
                    <p className="text-slate-400 text-sm mt-1">Click "Start Camera" to begin scanning</p>
                  </div>
                  {cameraError && (
                    <div className="mx-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center max-w-xs">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}

              {/* Scanning overlay */}
              {cameraOn && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-56 h-56">
                      {/* TL */}
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      {/* TR */}
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      {/* BL */}
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      {/* BR */}
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      {/* Scan line */}
                      <div
                        className="absolute left-2 right-2 h-0.5 bg-primary/80 shadow-lg"
                        style={{
                          animation: "scanLine 2s linear infinite",
                          boxShadow: "0 0 8px 2px rgba(59,130,246,0.6)",
                        }}
                      />
                    </div>
                  </div>
                  <style>{`
                    @keyframes scanLine {
                      0% { top: 12%; }
                      50% { top: 85%; }
                      100% { top: 12%; }
                    }
                  `}</style>
                </div>
              )}

              {/* Processing overlay */}
              {processingQR && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-white font-medium">Processing…</p>
                  </div>
                </div>
              )}

              {/* Success/Error overlay */}
              {scanResult && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    scanResult.success ? "bg-emerald-500/20 backdrop-blur-sm" : "bg-red-500/20 backdrop-blur-sm"
                  )}
                >
                  <div className={cn(
                    "bg-card rounded-2xl shadow-2xl p-6 mx-4 border text-center max-w-xs w-full",
                    scanResult.success ? "border-emerald-500/50" : "border-red-500/50"
                  )}>
                    {scanResult.success ? (
                      <>
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                          scanResult.action === "checkin" ? "bg-emerald-500/20" : "bg-blue-500/20"
                        )}>
                          {scanResult.action === "checkin"
                            ? <CheckCircle2 size={36} className="text-emerald-500" />
                            : <LogOut size={36} className="text-blue-500" />
                          }
                        </div>
                        <div className="text-xl font-display font-bold mb-1">
                          {scanResult.action === "checkin" ? "✅ Checked In!" : "🏁 Checked Out!"}
                        </div>
                        <div className="text-lg font-semibold text-primary mb-1">
                          {scanResult.employee?.name}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {typeof scanResult.employee?.department === "object" ? scanResult.employee?.department?.name : scanResult.employee?.department} · {scanResult.employee?.employeeId}
                        </div>
                        <div className="text-2xl font-display font-bold tabular-nums mb-2">
                          {scanResult.time ? format(new Date(scanResult.time), "hh:mm:ss a") : ""}
                        </div>
                        {scanResult.late && (
                          <div className="flex items-center justify-center gap-2 text-amber-500 text-sm font-medium">
                            <AlertTriangle size={14} />
                            Late by {scanResult.lateMinutes} minutes
                          </div>
                        )}
                        {scanResult.workingHours !== undefined && (
                          <div className="text-sm text-emerald-500 font-medium mt-1">
                            Worked {scanResult.workingHours.toFixed(1)} hours today
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                          <XCircle size={36} className="text-red-500" />
                        </div>
                        <div className="text-xl font-display font-bold mb-2 text-red-500">Scan Failed</div>
                        {scanResult.employee && (
                          <div className="text-sm font-medium mb-1">{scanResult.employee.name}</div>
                        )}
                        <div className="text-sm text-muted-foreground">{scanResult.error}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Camera controls overlay */}
              {cameraOn && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={flipCamera}
                    className="p-2 bg-black/50 rounded-lg backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              )}

              {/* Live indicator */}
              {cameraOn && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-semibold">LIVE</span>
                </div>
              )}
            </div>

            {/* Camera control buttons */}
            <div className="p-4 flex items-center justify-between gap-3 bg-card">
              <div className="text-sm text-muted-foreground">
                {cameraOn
                  ? `📡 Scanning in ${mode === "auto" ? "auto" : mode} mode…`
                  : "Camera is off"}
              </div>
              <div className="flex gap-2">
                {!cameraOn ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                  >
                    <Camera size={16} />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-all"
                  >
                    <CameraOff size={16} />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <QrCode size={15} className="text-primary" /> How to use
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Select scan mode: <b>Auto</b> (recommended), Check In, or Check Out</li>
              <li>Click <b>Start Camera</b> and grant camera permission</li>
              <li>Ask employee to open <b>My QR Code</b> page on their device</li>
              <li>Point camera at the QR code — it scans automatically!</li>
              <li>Result shows instantly with employee name and timestamp</li>
            </ol>
          </div>
        </div>

        {/* Live Log Panel */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-semibold">
                <Clock size={17} className="text-primary" />
                Live Scan Log
              </div>
              {recentLogs.length > 0 && (
                <button
                  onClick={() => setRecentLogs([])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
              {recentLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <QrCode size={24} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">No scans yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Scanned employees will appear here</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                        getAvatarColor(log.employee)
                      )}
                    >
                      {getInitials(log.employee)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{log.employee}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{log.department}</span>
                        {log.late && (
                          <span className="text-amber-500 font-medium">· +{log.lateMinutes}m late</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold mb-1",
                        log.action === "checkin"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-blue-500/15 text-blue-500"
                      )}>
                        {log.action === "checkin" ? <LogIn size={10} /> : <LogOut size={10} />}
                        {log.action === "checkin" ? "IN" : "OUT"}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{log.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                Total scans this session: <span className="font-bold text-foreground">{recentLogs.length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
