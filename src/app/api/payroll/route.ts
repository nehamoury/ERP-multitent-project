import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { logAudit } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const userId = searchParams.get("userId");
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = { vendorId: session.user.vendorId };
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ]
    };
  }
  if (session.user.role === "EMPLOYEE") where.userId = session.user.id;

  const [payrolls, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      include: { user: { select: { id: true, name: true, employeeId: true, department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }, { user: { name: "asc" } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payroll.count({ where }),
  ]);

  return NextResponse.json({ payrolls, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, month, year, basicSalary, allowances, deductions, notes } = body;

    const netAmount = (basicSalary || 0) + (allowances || 0) - (deductions || 0);

    const payroll = await prisma.payroll.create({
      data: {
        vendorId: session.user.vendorId,
        userId,
        month,
        year,
        basicSalary,
        allowances: allowances || 0,
        deductions: deductions || 0,
        netAmount,
        notes,
        status: "DRAFT",
      },
      include: { user: { select: { id: true, name: true, employeeId: true } } },
    });

    // Notify the employee
    await prisma.notification.create({
      data: {
        vendorId: session.user.vendorId,
        userId: payroll.userId,
        title: "Payroll Generated",
        message: `Your payroll for ${MONTHS[payroll.month - 1]} ${payroll.year} has been generated.`,
        type: "info"
      }
    });

    // Notify the Admin/HR who created it
    if (session.user.id !== payroll.userId) {
      await prisma.notification.create({
        data: {
          vendorId: session.user.vendorId,
          userId: session.user.id,
          title: "Payroll Created",
          message: `You successfully generated the payroll for ${payroll.user.name} (${MONTHS[payroll.month - 1]} ${payroll.year}).`,
          type: "success"
        }
      });
    }

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "Payroll", payroll.id, `Generated payroll for ${payroll.user.name} for ${MONTHS[payroll.month - 1]} ${payroll.year}`);

    return NextResponse.json({ payroll }, { status: 201 });
  } catch (error: unknown) {
    if ((error as any)?.code === "P2002") {
      return NextResponse.json({ error: "Payroll already exists for this employee in this period" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create payroll record" }, { status: 500 });
    }
  }

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role === "EMPLOYEE")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, basicSalary, allowances, deductions, notes, paidAt } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (basicSalary !== undefined) updateData.basicSalary = basicSalary;
    if (allowances !== undefined) updateData.allowances = allowances;
    if (deductions !== undefined) updateData.deductions = deductions;
    if (notes !== undefined) updateData.notes = notes;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : undefined;

    if (basicSalary !== undefined || allowances !== undefined || deductions !== undefined) {
      const current = await prisma.payroll.findUnique({ where: { id_vendorId: { id, vendorId: session.user.vendorId } } });
      if (current) {
        updateData.netAmount = (basicSalary ?? current.basicSalary) + (allowances ?? current.allowances) - (deductions ?? current.deductions);
      }
    }

    const payroll = await prisma.payroll.update({
      where: { id_vendorId: { id, vendorId: session.user.vendorId } },
      data: updateData,
      include: { user: { select: { id: true, name: true, employeeId: true } } },
    });

    if (status === "PAID") {
      // Notify the employee
      await prisma.notification.create({
        data: {
          vendorId: session.user.vendorId,
          userId: payroll.userId,
          title: "Salary Disbursed",
          message: `Your salary for ${MONTHS[payroll.month - 1]} ${payroll.year} has been disbursed successfully.`,
          type: "success"
        }
      }).catch(console.error);

      // Notify the Admin/HR who performed the action
      if (session.user.id !== payroll.userId) {
        await prisma.notification.create({
          data: {
            vendorId: session.user.vendorId,
            userId: session.user.id,
            title: "Disbursement Successful",
            message: `You have successfully disbursed the salary for ${payroll.user.name} (${MONTHS[payroll.month - 1]} ${payroll.year}).`,
            type: "success"
          }
        }).catch(console.error);
      }
    }

    await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Payroll", payroll.id, `Updated payroll for ${payroll.user.name} to status ${payroll.status}`);

    return NextResponse.json({ payroll });
  } catch {
    return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    await prisma.payroll.delete({ where: { id_vendorId: { id, vendorId: session.user.vendorId } } });
    await logAudit(session.user.id, session.user.vendorId, "DELETE", "Payroll", id, `Deleted payroll record`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete payroll" }, { status: 500 });
  }
}
