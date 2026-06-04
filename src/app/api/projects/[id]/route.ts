import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const where: any = { id: params.id, vendorId: session.user.vendorId };
        
        // Employee access check
        if (session.user.role === "EMPLOYEE") {
            where.OR = [
                { managerId: session.user.id },
                { members: { some: { id: session.user.id } } },
                { tasks: { some: { assigneeId: session.user.id } } }
            ];
        }

        const project = await prisma.project.findFirst({
            where,
            include: {
                manager: { select: { id: true, name: true, profileImage: true, email: true } },
                members: { select: { id: true, name: true, profileImage: true, email: true } },
                tasks: {
                    where: session.user.role === "EMPLOYEE" ? { assigneeId: session.user.id } : undefined,
                    include: {
                        assignee: { select: { id: true, name: true, profileImage: true, email: true } },
                        updates: { 
                            include: { user: { select: { name: true, profileImage: true } } },
                            orderBy: { createdAt: "desc" }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, description, status, startDate, endDate, managerId, teamMemberIds } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (managerId !== undefined) updateData.managerId = managerId;
        if (teamMemberIds !== undefined) {
            updateData.members = {
                set: teamMemberIds.map((id: string) => ({ id }))
            };
        }

        const project = await prisma.project.update({
            where: { id: params.id, vendorId: session.user.vendorId },
            data: updateData
        });

        await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Project", project.id, `Updated project: ${project.name}`);
        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.project.delete({
            where: { id: params.id, vendorId: session.user.vendorId }
        });

        await logAudit(session.user.id, session.user.vendorId, "DELETE", "Project", params.id, "Deleted project");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
