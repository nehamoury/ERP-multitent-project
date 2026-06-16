import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";
import { getRoleScope } from "@/lib/scopes";

export async function GET(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const scope = getRoleScope(session.user);
        const where: any = { vendorId: session.user.vendorId };

        if (scope.branchId) {
            where.OR = [
                { assignee: { branchId: scope.branchId } },
                { project: { members: { some: { branchId: scope.branchId } } } },
                { project: { manager: { branchId: scope.branchId } } }
            ];
        } else if (scope.id) {
            where.assigneeId = scope.id;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true } },
                project: { select: { name: true, managerId: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("GET Tasks Error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Employees cannot create tasks" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { projectId, title, description, status, priority, assigneeId, dueDate } = body;

        if (!projectId || !title) {
            return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                vendorId: session.user.vendorId,
                projectId,
                title,
                description,
                status: status || "TODO",
                priority: priority || "MEDIUM",
                assigneeId,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
            include: {
                assignee: { select: { id: true, name: true } }
            }
        });

        // Notify the assignee (only if it's someone else)
        if (assigneeId && assigneeId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    vendorId: session.user.vendorId,
                    userId: assigneeId,
                    title: "New Task Assigned",
                    message: `${session.user.name} assigned you a task: "${title}"`,
                    type: "info",
                }
            }).catch(console.error);
        }

        await logAudit(session.user.id, session.user.vendorId, "CREATE", "Task", task.id, `Created task: ${title}`);
        return NextResponse.json({ success: true, task }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status, priority, assigneeId, title, description, dueDate, progress, comment, attachment } = body;

        if (!id) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

        if (typeof progress === "number" && (progress < 0 || progress > 100)) {
            return NextResponse.json({ error: "Progress must be between 0 and 100" }, { status: 400 });
        }

        // Verify the task belongs to this vendor
        const existing = await prisma.task.findFirst({
            where: { id, vendorId: session.user.vendorId },
        });
        if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isEmployee = session.user.role === "EMPLOYEE";
        if (isEmployee && existing.assigneeId !== session.user.id) {
            return NextResponse.json({ error: "You can only update your own tasks" }, { status: 403 });
        }

        // Create TaskUpdate entry if progress or comment changed
        if (typeof progress === "number" || comment) {
            await prisma.taskUpdate.create({
                data: {
                    taskId: id,
                    userId: session.user.id,
                    content: comment ?? null,
                    progress: typeof progress === "number" ? progress : existing.progress,
                    status: status || existing.status,
                },
            });
        }

        const existingAttachments = ((existing as any).attachments as any[]) ?? [];
        const updatedAttachments = attachment ? [...existingAttachments, attachment] : existingAttachments;

        const data: any = {};
        if (status) data.status = status;
        if (typeof progress === "number") data.progress = progress;
        if (attachment) data.attachments = updatedAttachments;

        // Admin/HR can update additional fields
        if (!isEmployee) {
            if (priority) data.priority = priority;
            if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
            if (title) data.title = title;
            if (description !== undefined) data.description = description;
            if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        }

        const task = await prisma.task.update({
            where: { id_vendorId: { id, vendorId: session.user.vendorId } },
            data,
            include: {
                assignee: { select: { id: true, name: true } },
                project: { select: { name: true, managerId: true } },
            },
        });

        await logAudit(session.user.id, session.user.vendorId, "UPDATE", "Task", id, `Updated task: ${task.title}`);
        return NextResponse.json({ success: true, task });
    } catch (error) {
        console.error("PATCH Task Error:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}
