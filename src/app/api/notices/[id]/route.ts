import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, content, type, expiresAt, isActive } = body;

        const notice = await prisma.notice.update({
            where: { id: params.id, vendorId: session.user.vendorId },
            data: {
                title,
                content,
                type,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                isActive,
            },
        });

        await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Notice", notice.id, `Updated notice: ${title}`);
        return NextResponse.json({ success: true, notice });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const notice = await prisma.notice.delete({
            where: { id: params.id, vendorId: session.user.vendorId },
        });

        await logAudit(session.user.id, session.user.vendorId, "DELETE", "Notice", notice.id, `Deleted notice: ${notice.title}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
    }
}
