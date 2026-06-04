import { Metadata } from "next";
import SalaryClient from "@/components/employees/salary-client";

export const metadata: Metadata = { title: "My Payroll | AttendIQ" };

export default function SalaryPage() {
  return <SalaryClient />;
}
