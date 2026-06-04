// src/app/(dashboard)/admin/attendance/page.tsx
import { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import AttendanceClient from "@/components/attendance/attendance-client";

export const metadata: Metadata = { title: "Attendance Management" };

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="View and manage all employee attendance records"
        icon={Clock}
      />
      <AttendanceClient isAdmin />
    </div>
  );
}
