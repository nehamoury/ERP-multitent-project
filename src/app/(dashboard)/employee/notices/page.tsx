import { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import NoticesClient from "@/components/notices/notices-client";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Notice Board | Employee" };

export default async function EmployeeNoticesPage() {
    const session = await getAuth();
    if (!session?.user) redirect("/login");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Notice Board"
                description="Stay updated with company news and announcements"
                icon={Megaphone}
            />
            <NoticesClient userRole={session.user.role} userId={session.user.id} />
        </div>
    );
}
