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
    const folder = searchParams.get("folder");

    const where: any = { vendorId: session.user.vendorId };
    if (folder) {
      where.folder = folder;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploader: { select: { id: true, name: true, employeeId: true } }
      }
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
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
    const { title, description, fileUrl, fileType, size, folder } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and fileUrl are required" }, { status: 400 });
    }

    const document = await prisma.document.create({
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

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
