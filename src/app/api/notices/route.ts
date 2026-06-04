import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";

export async function GET(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    try {
        const where: any = { isActive: true, vendorId: session.user.vendorId };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        if (type) where.type = type;

        // Employees only see active notices that haven't expired
        if (session.user.role === "EMPLOYEE") {
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        }

        const [notices, total] = await Promise.all([
            prisma.notice.findMany({
                where,
                include: {
                    author: {
                        select: { name: true, role: true }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notice.count({ where }),
        ]);

        return NextResponse.json({ notices, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, content, type, expiresAt } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        const notice = await prisma.notice.create({
            data: {
                vendorId: session.user.vendorId,
                title,
                content,
                type: type || "INFO",
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                authorId: session.user.id,
            },
        });

        await logAudit(session.user.id, session.user.vendorId, "CREATE", "Notice", notice.id, `Created notice: ${title}`);
        return NextResponse.json({ success: true, notice }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
    }
}
