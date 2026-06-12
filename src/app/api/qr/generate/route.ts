// src/app/api/qr/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import crypto from "crypto";

// Generate a signed QR payload for an employee
// Format: { employeeId, userId, nonce, ts, sig }
function signPayload(userId: string, employeeId: string): string {
  const ts = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET not configured");
  const raw = `${userId}:${employeeId}:${nonce}:${ts}`;
  const sig = crypto.createHmac("sha256", secret).update(raw).digest("hex").slice(0, 16);
  return JSON.stringify({ userId, employeeId, nonce, ts, sig });
}

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Admin/HR can generate for any user; employee gets their own
  const targetUserId =
    ["ADMIN", "HR"].includes(session.user.role) && searchParams.get("userId")
      ? searchParams.get("userId")!
      : session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, employeeId: true, name: true, department: true, designation: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payload = signPayload(user.id, user.employeeId);

    // Generate QR as base64 PNG
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      qrDataUrl,
      user: { id: user.id, employeeId: user.employeeId, name: user.name, department: user.department },
      expiresIn: "Single use / regenerate for each session",
    });
  } catch (error) {
    console.error("QR generate error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
