"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Megaphone, Plus, Search, RefreshCw, Edit, Trash2,
    ChevronLeft, ChevronRight, X, Loader2, Calendar,
    Info, AlertTriangle, AlertCircle, CheckCircle, Pin, Bell, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { formatDate, getNoticeTypeColor, cn } from "@/lib/utils";
import { Button, EmptyState } from "@/components/ui/shared";

interface Notice {
    id: string;
    title: string;
    content: string;
    type: "INFO" | "WARNING" | "URGENT" | "SUCCESS";
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
    author: {
        name: string;
        role: string;
    };
}

interface Props {
    userRole: string;
    userId: string;
}

const NOTICE_TYPES = [
    { value: "INFO", label: "Information", icon: Info },
    { value: "WARNING", label: "Warning", icon: AlertTriangle },
    { value: "URGENT", label: "Urgent", icon: AlertCircle },
    { value: "SUCCESS", label: "Success", icon: CheckCircle },
];

export default function NoticesClient({ userRole, userId }: Props) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // UI state
    const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

    const [showModal, setShowModal] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const isAdminOrHR = ["ADMIN", "HR"].includes(userRole);

    const [form, setForm] = useState({
        title: "",
        content: "",
        type: "INFO",
        expiresAt: "",
    });

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (search) params.set("search", search);
            if (type) params.set("type", type);

            const res = await fetch(`/api/notices?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setNotices(data.notices || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, search, type]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const url = selectedNotice ? `/api/notices/${selectedNotice.id}` : "/api/notices";
            const method = selectedNotice ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(selectedNotice ? "Notice updated!" : "Notice posted!");
            setShowModal(false);
            setSelectedNotice(null);
            setForm({ title: "", content: "", type: "INFO", expiresAt: "" });
            fetchNotices();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this notice?")) return;

        try {
            const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete notice");

            setSuccess("Notice deleted!");
            fetchNotices();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openEditModal = (notice: Notice) => {
        setSelectedNotice(notice);
        setForm({
            title: notice.title,
            content: notice.content,
            type: notice.type,
            expiresAt: notice.expiresAt ? notice.expiresAt.split("T")[0] : "",
        });
        setShowModal(true);
    };

    const toggleExpand = (id: string) => {
        setExpandedNotices(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="space-y-6">
            {(error || success) && (
                <div className={cn("p-4 rounded-xl text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2",
                    success ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                )}>
                    <div className="flex items-center gap-2">
                        {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {error || success}
                    </div>
                    <button onClick={() => { setError(""); setSuccess(""); }}><X size={14} /></button>
                </div>
            )}

            {/* Header & Controls - Matching the screenshot style */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search notices..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    
                    <select 
                        value={type} 
                        onChange={(e) => { setType(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer hidden md:block"
                    >
                        <option value="">All Types</option>
                        {NOTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hidden sm:block">
                        {total} total notices
                    </div>
                    {isAdminOrHR && (
                        <button 
                            onClick={() => { setSelectedNotice(null); setForm({ title: "", content: "", type: "INFO", expiresAt: "" }); setShowModal(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} /> Post Notice
                        </button>
                    )}
                </div>
            </div>

            {/* Notice List */}
            <div className="flex flex-col gap-3">
                {loading && notices.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-muted animate-pulse border border-border" />
                    ))
                ) : notices.length === 0 ? (
                    <EmptyState
                        icon={Megaphone}
                        title="No active notices"
                        description="Stay tuned for important announcements and updates."
                    />
                ) : (
                    notices.map((notice) => {
                        const isExpanded = expandedNotices[notice.id];
                        const isUrgent = notice.type === "URGENT";
                        const isWarning = notice.type === "WARNING";
                        const isSuccess = notice.type === "SUCCESS";
                        
                        return (
                            <div
                                key={notice.id}
                                className={cn(
                                    "group border border-border bg-card rounded-xl overflow-hidden transition-all duration-200 hover:border-border/80",
                                    "border-l-4",
                                    isUrgent ? "border-l-red-500" : isWarning ? "border-l-orange-500" : isSuccess ? "border-l-emerald-500" : "border-l-blue-500"
                                )}
                            >
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start sm:items-center gap-4">
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                            isUrgent ? "bg-red-500/10 text-red-500" : 
                                            isWarning ? "bg-orange-500/10 text-orange-500" : 
                                            isSuccess ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                        )}>
                                            <Bell size={18} />
                                        </div>
                                        
                                        {/* Details */}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                {isUrgent && <Pin size={12} className="text-muted-foreground rotate-45" />}
                                                <h3 className="font-semibold text-sm text-foreground">{notice.title}</h3>
                                                
                                                {/* Badges mimicking the screenshot */}
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase",
                                                    isUrgent ? "bg-red-500/10 text-red-500" : 
                                                    isWarning ? "bg-orange-500/10 text-orange-500" : 
                                                    "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {isUrgent ? "HIGH" : isWarning ? "MEDIUM" : "LOW"}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wide">
                                                    {notice.type}
                                                </span>
                                                
                                                {/* Unread indicator dot (simulated) */}
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                                    {notice.author.name[0]}
                                                </div>
                                                <span className="font-medium text-foreground/80">{notice.author.name}</span>
                                                <span>•</span>
                                                <span>{formatDate(notice.createdAt)}</span>
                                                {notice.expiresAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={10} /> Exp: {formatDate(notice.expiresAt, "dd MMM")}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto text-muted-foreground">
                                        <button 
                                            onClick={() => toggleExpand(notice.id)}
                                            className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        
                                        {isAdminOrHR && (
                                            <>
                                                <button 
                                                    className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors hidden sm:block"
                                                >
                                                    <Pin size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(notice)}
                                                    className="p-1.5 rounded-md hover:bg-muted hover:text-primary transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(notice.id)}
                                                    className="p-1.5 rounded-md hover:bg-muted hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="p-4 pt-0 text-sm text-foreground/90 bg-muted/30 border-t border-border mt-1">
                                        <div className="whitespace-pre-wrap leading-relaxed py-2 pl-14">
                                            {notice.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium">Page {page} of {pages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Post/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="font-display font-bold text-lg">
                                {selectedNotice ? "Edit Notice" : "Post New Notice"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Important: Office timings updated..."
                                    className="w-full px-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Type (Priority)</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        className="w-full px-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {NOTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Expires At (Optional)</label>
                                    <input
                                        type="date"
                                        value={form.expiresAt}
                                        onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                                        className="w-full px-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Content</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.content}
                                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                                    placeholder="Detailed information about the announcement..."
                                    className="w-full px-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submitting} className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : (selectedNotice ? "Update" : "Post")}
                                </Button>
                                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 justify-center">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
