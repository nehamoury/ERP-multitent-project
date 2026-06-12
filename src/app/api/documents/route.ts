import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit, getErrorMessage } from "@/lib/utils";
import { getRoleScope } from "@/lib/scopes";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    const scope = getRoleScope(session.user);
    const where: any = { vendorId: session.user.vendorId };
    if (folder) {
      where.folder = folder;
    }
    if (scope.branchId) {
      where.uploader = { branchId: scope.branchId };
    }
    if (scope.id) {
      where.uploaderId = scope.id;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploader: { select: { id: true, name: true, employeeId: true } }
      }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  }

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, fileUrl, fileType, size, folder } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and fileUrl are required" }, { status: 400 });
    }

    const sizeMB = (size || 0) / (1024 * 1024);
    const maxStorageMB = (session.user as any).subscription?.maxStorageMB || 1024;
    const planName = (session.user as any).subscription?.planName || "FREE";

    const vendorSub = await prisma.vendorSubscription.findUnique({
      where: { vendorId: session.user.vendorId }
    });

    const currentStorage = vendorSub?.storageUsedMB || 0;

    if (currentStorage + sizeMB > maxStorageMB) {
      return NextResponse.json({
        success: false,
        message: `Storage limit reached for your plan (${maxStorageMB} MB). Please upgrade.`,
        code: "LIMIT_REACHED",
        planName,
        limit: maxStorageMB,
        used: currentStorage
      }, { status: 403 });
    }

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          vendorId: session.user.vendorId,
          uploaderId: session.user.id,
          title,
          description,
          fileUrl,
          fileType: fileType || "application/octet-stream",
          size: size || 0,
          folder
        }
      });

      if (vendorSub) {
        await tx.vendorSubscription.update({
          where: { id: vendorSub.id },
          data: { storageUsedMB: { increment: sizeMB } }
        });
      }

      return doc;
    });

    await logAudit(session.user.id, session.user.vendorId, "CREATE", "Document", document.id, `Uploaded document ${document.title}`);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  }
