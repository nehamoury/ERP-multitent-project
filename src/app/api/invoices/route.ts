import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { logAudit } from "@/lib/utils";

function generateInvoiceNumber(vendorId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const short = vendorId.slice(-4).toUpperCase();
  return `INV-${short}-${ts}`;
}

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = { vendorId: session.user.vendorId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.clientInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clientInvoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { clientName, clientEmail, clientPhone, amount, gstAmount, dueDate, notes } = body;

    const gst = gstAmount || 0;
    const totalAmount = (amount || 0) + gst;

    const invoice = await prisma.clientInvoice.create({
      data: {
        vendorId: session.user.vendorId,
        clientName,
        clientEmail,
        clientPhone,
        invoiceNumber: generateInvoiceNumber(session.user.vendorId),
        amount: amount || 0,
        gstAmount: gst,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: "DRAFT",
      },
    });

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "Invoice", invoice.id, `Created invoice ${invoice.invoiceNumber} for ${clientName}`);

    return NextResponse.json({ invoice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, clientName, clientEmail, clientPhone, amount, gstAmount, dueDate, notes } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (amount !== undefined) updateData.amount = amount;
    if (gstAmount !== undefined) updateData.gstAmount = gstAmount;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "PAID") updateData.paidAt = new Date();

    if (amount !== undefined || gstAmount !== undefined) {
      const current = await prisma.clientInvoice.findUnique({ where: { id_vendorId: { id, vendorId: session.user.vendorId } } });
      if (current) {
        updateData.totalAmount = (amount ?? current.amount) + (gstAmount ?? current.gstAmount);
      }
    }

    const invoice = await prisma.clientInvoice.update({
      where: { id_vendorId: { id, vendorId: session.user.vendorId } },
      data: updateData,
    });

    await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Invoice", invoice.id, `Updated invoice ${invoice.invoiceNumber} to status ${invoice.status}`);

    return NextResponse.json({ invoice });
  } catch {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    await prisma.clientInvoice.delete({ where: { id_vendorId: { id, vendorId: session.user.vendorId } } });
    await logAudit(session.user.id, session.user.vendorId, "DELETE", "Invoice", id, `Deleted client invoice`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
