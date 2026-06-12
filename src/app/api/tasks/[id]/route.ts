import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, status, priority, assigneeId, dueDate, progress, comment } = body;

        // Check if user is Admin/HR or the assignee of the task
        const existingTask = await prisma.task.findUnique({ where: { id: params.id, vendorId: session.user.vendorId } });
        if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isAdmin = ["ADMIN", "HR"].includes(session.user.role);
        if (!isAdmin && existingTask.assigneeId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateData: any = {};
        if (title !== undefined && isAdmin) updateData.title = title;
        if (description !== undefined && isAdmin) updateData.description = description;
        if (status !== undefined) updateData.status = status; // assignees can update status
        if (progress !== undefined) updateData.progress = progress; // assignees can update progress
        if (priority !== undefined && isAdmin) updateData.priority = priority;
        if (assigneeId !== undefined && isAdmin) updateData.assigneeId = assigneeId;
        if (dueDate !== undefined && isAdmin) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        // If there's a comment, or if status/progress changed, record a TaskUpdate
        const hasStatusChange = status !== undefined && status !== existingTask.status;
        const hasProgressChange = progress !== undefined && progress !== existingTask.progress;
        
        if (comment || hasStatusChange || hasProgressChange) {
            updateData.updates = {
                create: {
                    userId: session.user.id,
                    content: comment || null,
                    progress: progress !== undefined ? progress : existingTask.progress,
                    status: status !== undefined ? status : existingTask.status
                }
            };
        }

        const task = await prisma.task.update({
            where: { id_vendorId: { id: params.id, vendorId: session.user.vendorId } },
            data: updateData,
            include: {
                assignee: { select: { id: true, name: true, profileImage: true } },
                updates: {
                    include: { user: { select: { name: true, profileImage: true } } },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Task", task.id, `Updated task: ${task.title}`);
        return NextResponse.json({ success: true, task });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.task.delete({
            where: { id_vendorId: { id: params.id, vendorId: session.user.vendorId } }
        });

        await logAudit(session.user.id, session.user.vendorId, "DELETE", "Task", params.id, "Deleted task");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
