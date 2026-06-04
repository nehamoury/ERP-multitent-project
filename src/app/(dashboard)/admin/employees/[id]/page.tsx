import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const EmployeeProfileClient = dynamic<{ employeeId: string, userRole: string }>(() => import("@/components/employees/employee-profile-client"), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>
});

export const metadata: Metadata = { title: "Employee Profile - AttendIQ" };

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const session = await getAuth();
  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/employees" className="p-2 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Employee Profile</h1>
          <p className="text-muted-foreground mt-1">Detailed employee information and history</p>
        </div>
      </div>

      <EmployeeProfileClient employeeId={params.id} userRole={session.user.role} />
    </div>
  );
}
