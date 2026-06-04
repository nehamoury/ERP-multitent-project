"use client";

import { Download, FileText, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  planName: string;
  totalAmount: number;
  status: string;
  invoiceDate: string;
}

interface PaymentHistoryProps {
  invoices: Invoice[];
  vendorSettings?: {
    billingAddress: string | null;
    state: string | null;
    gstin: string | null;
  };
}

export function PaymentHistory({ invoices, vendorSettings }: PaymentHistoryProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadInvoice = async (invoice: Invoice) => {
    setDownloading(invoice.id);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text("AttendIQ", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Workforce CRM platform", 14, 26);
      
      // Invoice Details
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("TAX INVOICE", 140, 20);
      
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 140, 28);
      doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 140, 34);
      doc.text(`Status: ${invoice.status}`, 140, 40);

      // Billed To
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Billed To:", 14, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(vendorSettings?.billingAddress || "Billing Address Not Provided", 14, 52);
      doc.text(`State: ${vendorSettings?.state || "N/A"}`, 14, 58);
      if (vendorSettings?.gstin) {
        doc.text(`GSTIN: ${vendorSettings.gstin}`, 14, 64);
      }

      const baseAmount = invoice.totalAmount / 1.18;
      const gstAmount = invoice.totalAmount - baseAmount;

      // Items Table
      autoTable(doc, {
        startY: 75,
        head: [["Description", "Amount"]],
        body: [
          [`Subscription Plan: ${invoice.planName}`, `Rs. ${baseAmount.toFixed(2)}`],
          [`GST (18%)`, `Rs. ${gstAmount.toFixed(2)}`],
        ],
        foot: [["Total Amount", `Rs. ${invoice.totalAmount.toFixed(2)}`]],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Thank you for your business!", 14, finalY + 20);
      doc.text("This is a computer generated invoice and does not require a physical signature.", 14, finalY + 26);

      doc.save(`${invoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(null);
    }
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium">No payment history</h3>
        <p className="text-xs text-muted-foreground mt-1">You haven't made any payments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-lg">Payment History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-6 py-3 font-medium">Invoice</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-primary">
                  #{invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td className="px-6 py-4">
                  {invoice.planName}
                </td>
                <td className="px-6 py-4 font-medium">
                  ₹{invoice.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {invoice.status === "PAID" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {invoice.status === "PENDING" && <Clock className="w-4 h-4 text-amber-500" />}
                    {invoice.status === "FAILED" && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-xs font-semibold capitalize">{invoice.status.toLowerCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    disabled={invoice.status !== "PAID" || downloading === invoice.id}
                    onClick={() => downloadInvoice(invoice)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:hover:no-underline"
                  >
                    {downloading === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
