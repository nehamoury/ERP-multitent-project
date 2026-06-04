import { Metadata } from "next";
import SupportEmployeeClient from "@/components/employees/support-employee-client";
export const metadata: Metadata = { title: "Support | AttendIQ" };
export default function SupportPage() { return <SupportEmployeeClient />; }
