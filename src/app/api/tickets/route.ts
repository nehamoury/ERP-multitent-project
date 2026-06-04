import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { vendorId: session.user.vendorId };
    if (status) {
      where.status = status;
    }

    // If regular employee, only show their tickets. Otherwise all for the vendor.
    if (session.user.role === "EMPLOYEE") {
      where.creatorId = session.user.id;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, profileImage: true } },
        assignedTo: { select: { id: true, name: true, profileImage: true } }
      }
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, priority } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        vendorId: session.user.vendorId,
        creatorId: session.user.id,
        subject,
        description,
        priority: priority || "MEDIUM",
        status: "OPEN"
      }
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
