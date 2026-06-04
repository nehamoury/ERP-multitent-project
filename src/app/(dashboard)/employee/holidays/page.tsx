import { Metadata } from "next";
import HolidayClient from "@/components/employees/holiday-client";

export const metadata: Metadata = { title: "Holiday Calendar | AttendIQ" };

export default function HolidaysPage() {
  return <HolidayClient />;
}
