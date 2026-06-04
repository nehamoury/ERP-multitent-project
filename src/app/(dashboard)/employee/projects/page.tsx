import { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import ProjectsTasksClient from "@/components/projects/projects-tasks-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My Tasks | Employee" };

export default async function EmployeeProjectsPage() {
    const session = await getAuth();
    if (!session?.user) redirect("/login");

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Projects"
                description="View your assigned projects and update task progress"
                icon={Briefcase}
            />
            <ProjectsTasksClient userRole={session.user.role} userId={session.user.id} />
        </div>
    );
}
