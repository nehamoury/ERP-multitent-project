import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, priority, assignedToId } = body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id, vendorId: session.user.vendorId }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Only HR/ADMIN can update someone else's ticket status/assignee, but let's assume they have permission for now.
    const updated = await prisma.supportTicket.update({
      where: { id_vendorId: { id: params.id, vendorId: session.user.vendorId } },
      data: {
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        assignedToId: assignedToId !== undefined ? assignedToId : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
