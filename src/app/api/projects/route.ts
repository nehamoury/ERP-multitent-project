import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/utils";
import { getRoleScope } from "@/lib/scopes";

export async function GET(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "";

        const scope = getRoleScope(session.user);
        const where: any = { vendorId: session.user.vendorId };
        if (status) where.status = status;
        
        if (scope.branchId) {
            where.OR = [
                { manager: { branchId: scope.branchId } },
                { members: { some: { branchId: scope.branchId } } }
            ];
        } else if (scope.id) {
            where.OR = [
                { managerId: scope.id },
                { members: { some: { id: scope.id } } },
                { tasks: { some: { assigneeId: scope.id } } }
            ];
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                manager: { select: { id: true, name: true, profileImage: true, email: true } },
                members: { select: { id: true, name: true, profileImage: true, email: true } },
                tasks: {
                    where: session.user.role === "EMPLOYEE" ? { assigneeId: session.user.id } : undefined,
                    select: {
                        id: true,
                        status: true,
                        progress: true,
                        assignee: { select: { id: true, name: true, profileImage: true } }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, description, status, startDate, endDate, managerId, teamMemberIds } = body;

        if (!name || !managerId) {
            return NextResponse.json({ error: "Name and Manager are required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                vendorId: session.user.vendorId,
                name,
                description,
                status: status || "PLANNING",
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                managerId,
                members: teamMemberIds && teamMemberIds.length > 0 ? {
                    connect: teamMemberIds.map((id: string) => ({ id }))
                } : undefined,
            },
        });

        await logAudit(session.user.id, session.user.vendorId, "CREATE", "Project", project.id, `Created project: ${name}`);
        return NextResponse.json({ success: true, project }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
