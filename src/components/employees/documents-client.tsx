"use client";

import { useState } from "react";
import { FileText, Download, Send, CheckCircle2, Check, X, FileBadge, FileSpreadsheet, Briefcase, FileStack } from "lucide-react";
import { cn } from "@/lib/utils";

type DocType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
};

const DOCS: DocType[] = [
  { id: "offer", name: "Offer Letter", description: "Initial offer letter and compensation details.", icon: FileText, available: true },
  { id: "appointment", name: "Appointment Letter", description: "Official employment appointment letter.", icon: Briefcase, available: true },
  { id: "id_card", name: "ID Card", description: "Digital copy of your employee identity card.", icon: FileBadge, available: false },
  { id: "salary_slip", name: "Latest Salary Slip", description: "Payslip for the most recent processed month.", icon: FileSpreadsheet, available: true },
  { id: "form_16", name: "Form 16 (Tax)", description: "TDS certificate for tax filing.", icon: FileStack, available: false },
  { id: "experience", name: "Experience Certificate", description: "Certificate detailing your tenure and role.", icon: FileBadge, available: false },
];

export default function DocumentsClient() {
  const [requestedDocs, setRequestedDocs] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRequest = async (docId: string, docName: string) => {
    try {
      // Create a notification for HR
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Document Request",
          message: `Requested document: ${docName}`,
          type: "INFO"
        }),
      });

      if (!res.ok) throw new Error("Failed to request document");
      
      setRequestedDocs(p => ({ ...p, [docId]: true }));
      showToast(`Request for ${docName} sent to HR successfully.`);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDownload = (docName: string) => {
    showToast(`Downloading ${docName}...`);
    // In a real app, this would fetch a signed URL or blob from storage and trigger download
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm animate-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Access or request your employment documents</p>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCS.map((doc) => {
          const isRequested = requestedDocs[doc.id];
          
          return (
            <div key={doc.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border", 
                  doc.available ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-muted text-muted-foreground border-border"
                )}>
                  <doc.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{doc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{doc.description}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md", 
                  doc.available ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  {doc.available ? "Available" : "Not Available"}
                </span>

                {doc.available ? (
                  <button 
                    onClick={() => handleDownload(doc.name)}
                    className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                ) : isRequested ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={14} /> Requested
                  </span>
                ) : (
                  <button 
                    onClick={() => handleRequest(doc.id, doc.name)}
                    className="flex items-center gap-1.5 text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors border border-border"
                  >
                    <Send size={14} /> Request
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
