// src/app/(dashboard)/hr/attendance/page.tsx
import { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/shared";
import AttendanceClient from "@/components/attendance/attendance-client";

export const metadata: Metadata = { title: "Attendance – HR" };

export default function HRAttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Records" description="View all employee attendance" icon={Clock} />
      <AttendanceClient isAdmin />
    </div>
  );
}
