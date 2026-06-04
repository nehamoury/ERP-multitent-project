import { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import MyAttendanceClient from "@/components/employees/my-attendance-client";

export const metadata: Metadata = { title: "My Attendance" };

export default async function EmployeeAttendancePage() {
  const session = await getAuth();
  if (!session?.user) return null;

  const today = new Date();
  const todayRecord = await prisma.attendance.findFirst({
    where: { userId: session.user.id, date: { gte: startOfDay(today), lte: endOfDay(today) } },
  });

  return (
    <MyAttendanceClient 
      userId={session.user.id}
      userName={session.user.name}
      todayRecord={todayRecord ? {
        ...todayRecord,
        date: todayRecord.date.toISOString(),
        checkIn: todayRecord.checkIn?.toISOString() ?? null,
        checkOut: todayRecord.checkOut?.toISOString() ?? null,
      } : null}
    />
  );
}
