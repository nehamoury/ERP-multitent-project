import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

const VALID_RESOURCES = [
  "employees", "attendance", "leaves", "notices", "projects",
  "payroll", "invoices", "work_reports", "reports", "settings",
];

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const permissions = await prisma.permission.findMany({
    where: { vendorId: session.user.vendorId },
    orderBy: [{ role: "asc" }, { resource: "asc" }],
  });

  return NextResponse.json({ permissions });
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { role, resource, canCreate, canRead, canUpdate, canDelete } = body;

    if (!VALID_RESOURCES.includes(resource)) {
      return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
    }

    const permission = await prisma.permission.upsert({
      where: {
        vendorId_role_resource: {
          vendorId: session.user.vendorId,
          role,
          resource,
        },
      },
      update: { canCreate, canRead, canUpdate, canDelete },
      create: {
        vendorId: session.user.vendorId,
        role,
        resource,
        canCreate: canCreate || false,
        canRead: canRead || false,
        canUpdate: canUpdate || false,
        canDelete: canDelete || false,
      },
    });

    return NextResponse.json({ permission }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save permission" }, { status: 500 });
  }
}
