"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, CheckCircle2, XCircle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSuccess?: (data: any) => void;
}

export default function EmployeeScanner({ onSuccess }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // ── Play beep sound ─────────────────────────────────────────────
  const playBeep = (success: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = success ? 880 : 300;
      osc.type = "square"; // square is much louder and clearer than sine
      
      // Volume control
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // short crisp beep
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.error("Audio playback failed", err);
    }
  };

  // ── Start camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, [facingMode]);

  // ── Stop camera ─────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Auto-start camera on mount ──────────────────────────────────
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // ── Handle QR detected ──────────────────────────────────────────
  const handleQR = async (qrData: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData, action: "auto" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        playBeep(true);
        const actionText = data.action === "checkin" ? "Checked In" : "Checked Out";
        setResult({ success: true, message: `✅ ${actionText} Successfully!` });
        // Close camera and send data immediately
        setTimeout(() => {
            stopCamera();
            onSuccess?.(data);
        }, 800); // 800ms delay to see the green success icon before closing
      } else {
        playBeep(false);
        setResult({ success: false, message: data.error || "Scan failed" });
      }
    } catch {
      playBeep(false);
      setResult({ success: false, message: "Network error. Try again." });
    } finally {
      setProcessing(false);
      setTimeout(() => setResult(null), 3000);
    }
  };

  // ── QR scanning loop ───────────────────────────────────────────
  useEffect(() => {
    if (!cameraOn) return;

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

      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        const now = Date.now();
        if (code.data !== lastScanRef.current || now - lastScanTimeRef.current > 5000) {
          lastScanRef.current = code.data;
          lastScanTimeRef.current = now;
          if (!processing) {
            await handleQR(code.data);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraOn, processing]);

  const flipCamera = () => {
    stopCamera();
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
    setTimeout(() => startCamera(), 300);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera View */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          className={cn("w-full h-full object-cover", !cameraOn && "hidden")}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Placeholder when camera is off */}
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-slate-800">
            <Camera size={40} className="text-primary/60" />
            <p className="text-white/60 text-sm">Starting camera…</p>
            {cameraError && (
              <div className="mx-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center max-w-xs">
                {cameraError}
              </div>
            )}
          </div>
        )}

        {/* Scanning frame overlay */}
        {cameraOn && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />
                <div
                  className="absolute left-2 right-2 h-0.5 bg-primary/80"
                  style={{
                    animation: "empScanLine 2s linear infinite",
                    boxShadow: "0 0 8px 2px rgba(59,130,246,0.5)",
                  }}
                />
              </div>
            </div>
            <style>{`
              @keyframes empScanLine {
                0% { top: 15%; }
                50% { top: 80%; }
                100% { top: 15%; }
              }
            `}</style>
          </div>
        )}

        {/* Processing spinner */}
        {processing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Result overlay */}
        {result && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center backdrop-blur-sm",
            result.success ? "bg-emerald-500/20" : "bg-red-500/20"
          )}>
            <div className={cn(
              "bg-card rounded-2xl shadow-2xl px-8 py-6 mx-4 border text-center max-w-xs",
              result.success ? "border-emerald-500/50" : "border-red-500/50"
            )}>
              {result.success
                ? <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                : <XCircle size={48} className="text-red-500 mx-auto mb-3" />
              }
              <p className={cn(
                "text-lg font-bold",
                result.success ? "text-emerald-500" : "text-red-500"
              )}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* Camera controls */}
        {cameraOn && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-semibold">SCANNING</span>
            </div>
            <button
              onClick={flipCamera}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-lg backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              title="Flip camera"
            >
              <RefreshCw size={16} />
            </button>
          </>
        )}
      </div>

      {/* Simple instruction */}
      <p className="text-sm text-muted-foreground text-center">
        Point your camera at the Admin's QR code to mark attendance
      </p>

      {/* Camera toggle */}
      {!cameraOn && !cameraError && (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <Camera size={16} /> Start Camera
        </button>
      )}
      {cameraError && (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <Camera size={16} /> Retry
        </button>
      )}
    </div>
  );
}
