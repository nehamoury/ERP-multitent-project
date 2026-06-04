"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, FileText, Download, Plus, Search, Loader2, X, FileImage, File } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Button, EmptyState } from "@/components/ui/shared";

export default function DocumentsClient({ isAdmin }: { isAdmin?: boolean }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({ title: "", description: "", fileUrl: "", folder: "General" });

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // For mockup, we use the text field as a URL. Real app would do file upload to S3 first.
        body: JSON.stringify({ ...form, fileType: "application/pdf" })
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", description: "", fileUrl: "", folder: "General" });
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..." 
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Upload Document
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Folder} title="No documents found" description="Upload documents to share with the team." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                {doc.fileType.includes("pdf") ? <FileText size={24} /> : doc.fileType.includes("image") ? <FileImage size={24} /> : <File size={24} />}
              </div>
              <h4 className="font-semibold text-foreground line-clamp-1 mb-1">{doc.title}</h4>
              <p className="text-xs text-muted-foreground mb-4">Uploaded by {doc.uploader.name} on {formatDate(doc.createdAt, "dd MMM yyyy")}</p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{doc.folder || "General"}</span>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Download size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Upload Document</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm" placeholder="Employee Handbook" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Folder/Category</label>
                <select value={form.folder} onChange={e => setForm(p => ({...p, folder: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm">
                  <option>General</option>
                  <option>HR</option>
                  <option>Policies</option>
                  <option>Training</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">File URL * (Mockup)</label>
                <input required value={form.fileUrl} onChange={e => setForm(p => ({...p, fileUrl: e.target.value}))} className="w-full p-2.5 rounded-xl border border-border bg-muted/50 text-sm" placeholder="https://example.com/file.pdf" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full mt-2">
                {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                Upload
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
