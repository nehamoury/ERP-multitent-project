import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = { vendorId: session.user.vendorId };
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }
  if (session.user.role === "EMPLOYEE") where.userId = session.user.id;

  const [reports, total] = await Promise.all([
    prisma.workReport.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, employeeId: true, department: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { date, description, hoursWorked } = body;

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const report = await prisma.workReport.create({
      data: {
        vendorId: session.user.vendorId,
        userId: session.user.id,
        date: reportDate,
        description,
        hoursWorked: parseFloat(hoursWorked),
        status: "SUBMITTED",
      },
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Work report already exists for this date" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create work report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, description, hoursWorked, reviewNote } = body;

    const report = await prisma.workReport.findUnique({
      where: { id, vendorId: session.user.vendorId },
    });

    if (!report) return NextResponse.json({ error: "Work report not found" }, { status: 404 });

    const updateData: any = {};

    if (session.user.role === "EMPLOYEE" && report.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      if (status) return NextResponse.json({ error: "Employees cannot change status" }, { status: 403 });
      if (description !== undefined) updateData.description = description;
      if (hoursWorked !== undefined) updateData.hoursWorked = parseFloat(hoursWorked);
    }

    if (["ADMIN", "HR"].includes(session.user.role)) {
      if (status) {
        updateData.status = status;
        updateData.reviewedBy = session.user.id;
      }
      if (reviewNote !== undefined) updateData.reviewNote = reviewNote;
    }

    const updated = await prisma.workReport.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ report: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update work report" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();

    const report = await prisma.workReport.findUnique({
      where: { id, vendorId: session.user.vendorId },
    });

    if (!report) return NextResponse.json({ error: "Work report not found" }, { status: 404 });

    if (session.user.role === "EMPLOYEE" && report.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE" && report.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Cannot delete approved/rejected report" }, { status: 403 });
    }

    await prisma.workReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete work report" }, { status: 500 });
  }
}
