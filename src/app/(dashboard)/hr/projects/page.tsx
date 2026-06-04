import { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import ProjectsTasksClient from "@/components/projects/projects-tasks-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Projects & Tasks | HR" };

export default async function HRProjectsPage() {
    const session = await getAuth();
    if (!session?.user) redirect("/login");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Projects & Tasks"
                description="View projects and manage task assignments"
                icon={Briefcase}
            />
            <ProjectsTasksClient userRole={session.user.role} userId={session.user.id} />
        </div>
    );
}
