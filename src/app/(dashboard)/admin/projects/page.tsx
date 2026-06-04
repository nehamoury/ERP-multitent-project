import { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import ProjectsClient from "../../../../components/projects/projects-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Projects | Admin" };

export default async function AdminProjectsPage() {
    const session = await getAuth();
    if (!session?.user) redirect("/login");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Project Management"
                description="Create and track all company projects and tasks"
                icon={FolderKanban}
            />
            <ProjectsClient userRole={session.user.role} userId={session.user.id} />
        </div>
    );
}
