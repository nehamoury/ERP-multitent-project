import { Metadata } from "next";
import DocumentsClient from "@/components/employees/documents-client";

export const metadata: Metadata = { title: "Documents | AttendIQ" };

export default function DocumentsPage() {
  return <DocumentsClient />;
}
