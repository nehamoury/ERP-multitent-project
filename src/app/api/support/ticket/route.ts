import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { vendorId: true },
    });

    if (!user?.vendorId) {
      return NextResponse.json({ error: "Vendor not found for user" }, { status: 404 });
    }

    const finalSubject = category ? `[${category}] ${subject}` : subject;

    const ticket = await prisma.supportTicket.create({
      data: {
        subject: finalSubject,
        description: message,
        creatorId: session.user.id,
        vendorId: user.vendorId,
        status: "OPEN",
        priority: "MEDIUM",
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
