import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      vendorId: session.user.vendorId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(isActive !== null ? { isActive: isActive === 'true' } : { isActive: true }) // Default to active only unless specified
    };

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { users: true, departments: true, teams: true }
        },
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    const total = await prisma.branch.count({ where });

    return NextResponse.json({ 
      success: true, 
      message: "Branches fetched successfully", 
      data: branches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to fetch branches", errors: [error.message] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden", errors: [] }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: "Branch name is required", errors: [] }, { status: 400 });
    }

    const maxBranches = (session.user as any).subscription?.maxBranches || 1;
    const planName = (session.user as any).subscription?.planName || "FREE";
    const branchCount = await prisma.branch.count({ where: { vendorId: session.user.vendorId } });

    if (branchCount >= maxBranches) {
      return NextResponse.json({
        success: false,
        message: `Branch limit reached for your plan (${maxBranches}). Please upgrade.`,
        code: "LIMIT_REACHED",
        planName,
        limit: maxBranches,
        used: branchCount
      }, { status: 403 });
    }

    const exists = await prisma.branch.findFirst({
      where: { name: body.name, vendorId: session.user.vendorId }
    });

    if (exists) {
      return NextResponse.json({ success: false, message: "Branch with this name already exists", errors: [] }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        code: body.code || null,
        location: body.location || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        contactPerson: body.contactPerson || null,
        contactNumber: body.contactNumber || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        managerId: body.managerId || null,
        vendorId: session.user.vendorId,
        createdBy: session.user.id,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        action: "CREATE",
        description: `Created Branch: ${branch.name}`,
      }
    });

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "Branch", branch.id, `Created branch ${branch.name}`);

    return NextResponse.json({ success: true, message: "Branch created successfully", data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Failed to create branch", errors: [error.message] }, { status: 500 });
  }
}
