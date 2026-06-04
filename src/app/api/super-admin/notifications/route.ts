import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mock global notifications since we don't have a GlobalNotice table yet
  return NextResponse.json([
    {
      id: "1",
      title: "System Maintenance",
      message: "AttendiQ will be down for maintenance on Saturday at 2 AM UTC.",
      type: "WARNING",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      title: "New Feature: Payroll",
      message: "Payroll module is now available for Enterprise customers.",
      type: "SUCCESS",
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ]);
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    // Here you would typically insert a GlobalNotice into the database
    // For now, we simulate a successful broadcast
    return NextResponse.json({ success: true, message: "Notification broadcasted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
