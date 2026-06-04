"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Briefcase, Plus, Search, X, Loader2, Calendar,
    CheckCircle2, Clock, AlertCircle, User, ChevronRight,
    BarChart3, Users, ListTodo, Circle
} from "lucide-react";
import { formatDate, cn, getInitials, getAvatarColor } from "@/lib/utils";
import { Button, EmptyState, Badge } from "@/components/ui/shared";

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    manager: {
        id: string;
        name: string;
        profileImage: string | null;
        email: string;
    };
    members?: {
        id: string;
        name: string;
        profileImage: string | null;
        email: string;
    }[];
    tasks: {
        id: string;
        title: string;
        status: string;
        priority: string;
        description: string | null;
        dueDate: string | null;
        assignee: { id: string; name: string } | null;
    }[];
}

interface Props {
    userRole: string;
    userId: string;
}

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; label: string }> = {
    TODO: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
    IN_PROGRESS: { icon: Clock, color: "text-blue-500", label: "In Progress" },
    REVIEW: { icon: AlertCircle, color: "text-amber-500", label: "In Review" },
    COMPLETED: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
    BLOCKED: { icon: AlertCircle, color: "text-red-500", label: "Blocked" },
};

export default function ProjectsTasksClient({ userRole, userId }: Props) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team">("overview");
    const [showAddTask, setShowAddTask] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [taskForm, setTaskForm] = useState({
        title: "", description: "", priority: "MEDIUM", dueDate: ""
    });
    const [statusFilter, setStatusFilter] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const isAdminOrHR = ["ADMIN", "HR"].includes(userRole);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data || []);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchProjects().finally(() => setLoading(false));
    }, [fetchProjects]);

    const getProgress = (project: Project) => {
        if (!project.tasks || project.tasks.length === 0) return { percent: 0, completed: 0, total: 0 };
        const completed = project.tasks.filter(t => t.status === "COMPLETED").length;
        return { percent: Math.round((completed / project.tasks.length) * 100), completed, total: project.tasks.length };
    };

    const getProjectTeam = (project: Project) => {
        const teamMap = new Map();
        if (project.manager) teamMap.set(project.manager.id, project.manager);
        if (project.members) {
            project.members.forEach(m => teamMap.set(m.id, m));
        }
        project.tasks?.forEach(t => {
            if (t.assignee) teamMap.set(t.assignee.id, t.assignee);
        });
        return Array.from(teamMap.values());
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !taskForm.title.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    title: taskForm.title,
                    description: taskForm.description,
                    priority: taskForm.priority,
                    assigneeId: userId,
                    dueDate: taskForm.dueDate || undefined,
                }),
            });
            if (res.ok) {
                showToast("Task added successfully!");
                setShowAddTask(false);
                setTaskForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
                await fetchProjects();
                // Re-select the project with updated data
                const updatedProjects = await fetch("/api/projects").then(r => r.json());
                const updated = (updatedProjects || []).find((p: Project) => p.id === selectedProject.id);
                if (updated) setSelectedProject(updated);
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to add task", "error");
            }
        } catch { showToast("Failed to add task", "error"); }
        finally { setSubmitting(false); }
    };

    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            const res = await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: taskId, status }),
            });
            if (res.ok) {
                showToast("Task updated!");
                await fetchProjects();
                const updatedProjects = await fetch("/api/projects").then(r => r.json());
                const updated = (updatedProjects || []).find((p: Project) => p.id === selectedProject?.id);
                if (updated) setSelectedProject(updated);
            }
        } catch { showToast("Failed to update task", "error"); }
    };

    const filteredProjects = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2",
                    toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                )}>
                    {toast.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "TOTAL PROJECTS",
                        value: projects.length,
                        color: "text-foreground",
                        iconBg: "bg-blue-500/10",
                        iconColor: "text-blue-500",
                        icon: Briefcase,
                    },
                    {
                        label: "ACTIVE",
                        value: projects.filter(p => p.status === "ACTIVE" || p.status === "PLANNING").length,
                        color: "text-emerald-500",
                        iconBg: "bg-emerald-500/10",
                        iconColor: "text-emerald-500",
                        icon: Clock,
                    },
                    {
                        label: "COMPLETED",
                        value: projects.filter(p => p.status === "COMPLETED").length,
                        color: "text-primary",
                        iconBg: "bg-primary/10",
                        iconColor: "text-primary",
                        icon: CheckCircle2,
                    },
                    {
                        label: "OVERDUE",
                        value: projects.filter(p => p.endDate && new Date(p.endDate) < new Date() && p.status !== "COMPLETED" && p.status !== "CANCELLED").length,
                        color: "text-red-500",
                        iconBg: "bg-red-500/10",
                        iconColor: "text-red-500",
                        icon: AlertCircle,
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.iconBg)}>
                            <stat.icon size={20} className={stat.iconColor} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
                >
                    <option value="">All Status</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full"><EmptyState icon={Briefcase} title="No projects found" description="No projects available." /></div>
                ) : filteredProjects.map(project => {
                    const { percent, completed, total } = getProgress(project);
                    const todoCount = project.tasks?.filter(t => t.status === "TODO").length || 0;
                    const inProgressCount = project.tasks?.filter(t => t.status === "IN_PROGRESS" || t.status === "REVIEW").length || 0;

                    return (
                        <div
                            key={project.id}
                            onClick={() => { setSelectedProject(project); setActiveTab("overview"); }}
                            className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                                <Badge label={project.status} />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{project.description || "No description"}</p>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground font-medium">Progress</span>
                                    <span className="font-bold text-primary">{percent}%</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all duration-500"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                    { label: "Todo", value: todoCount, color: "text-muted-foreground" },
                                    { label: "In Progress", value: inProgressCount, color: "text-blue-500" },
                                    { label: "Done", value: completed, color: "text-emerald-500" },
                                ].map(s => (
                                    <div key={s.label} className="text-center bg-muted/50 rounded-lg py-1.5">
                                        <div className={cn("text-sm font-bold", s.color)}>{s.value}</div>
                                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <User size={12} />
                                    {project.manager?.name || "Unassigned"}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                    <span>{total} tasks</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border flex-shrink-0">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <Badge label={selectedProject.status} />
                                    <h2 className="text-xl font-bold mt-2">{selectedProject.name}</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{selectedProject.description || "No description"}</p>
                                </div>
                                <button onClick={() => setSelectedProject(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Overall Progress */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="font-medium text-muted-foreground">Overall Progress</span>
                                    <span className="font-bold">
                                        {getProgress(selectedProject).percent}% · {getProgress(selectedProject).completed}/{getProgress(selectedProject).total} tasks
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all duration-500"
                                        style={{ width: `${getProgress(selectedProject).percent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 mt-5 p-1 bg-muted w-fit rounded-xl">
                                {([
                                    { key: "overview", label: "Overview", icon: BarChart3 },
                                    { key: "tasks", label: `Tasks (${selectedProject.tasks?.length || 0})`, icon: ListTodo },
                                    { key: "team", label: `Team`, icon: Users },
                                ] as const).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            activeTab === tab.key
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <tab.icon size={13} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* OVERVIEW TAB */}
                            {activeTab === "overview" && (
                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: "Total Tasks", value: selectedProject.tasks?.length || 0, color: "text-foreground" },
                                            { label: "Completed", value: selectedProject.tasks?.filter(t => t.status === "COMPLETED").length || 0, color: "text-emerald-500" },
                                            { label: "In Progress", value: selectedProject.tasks?.filter(t => t.status === "IN_PROGRESS" || t.status === "REVIEW").length || 0, color: "text-blue-500" },
                                            { label: "Blocked", value: selectedProject.tasks?.filter(t => t.status === "BLOCKED").length || 0, color: "text-red-500" },
                                        ].map(s => (
                                            <div key={s.label} className="text-center bg-muted/50 rounded-xl p-3 border border-border">
                                                <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Task Status Breakdown */}
                                    <div>
                                        <h4 className="font-bold text-sm mb-3">Task Status Breakdown</h4>
                                        <div className="space-y-2.5">
                                            {TASK_STATUSES.map(status => {
                                                const config = STATUS_CONFIG[status];
                                                const count = selectedProject.tasks?.filter(t => t.status === status).length || 0;
                                                const pct = selectedProject.tasks?.length ? Math.round((count / selectedProject.tasks.length) * 100) : 0;
                                                const Icon = config.icon;
                                                return (
                                                    <div key={status} className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 w-28 flex-shrink-0">
                                                            <Icon size={14} className={config.color} />
                                                            <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                                                        </div>
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all", {
                                                                    "bg-muted-foreground/30": status === "TODO",
                                                                    "bg-blue-500": status === "IN_PROGRESS",
                                                                    "bg-amber-500": status === "REVIEW",
                                                                    "bg-emerald-500": status === "COMPLETED",
                                                                    "bg-red-500": status === "BLOCKED",
                                                                })}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-24 text-right">{count} tasks ({pct}%)</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Project Info */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Manager", value: selectedProject.manager?.name || "Unassigned" },
                                            { label: "Start Date", value: selectedProject.startDate ? formatDate(selectedProject.startDate) : "—" },
                                            { label: "End Date", value: selectedProject.endDate ? formatDate(selectedProject.endDate) : "—" },
                                            { label: "Status", value: selectedProject.status },
                                        ].map(info => (
                                            <div key={info.label} className="bg-muted/30 rounded-xl p-3 border border-border">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{info.label}</div>
                                                <div className="text-sm font-semibold">{info.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* TASKS TAB */}
                            {activeTab === "tasks" && (
                                <>
                                    {/* Add Task Button */}
                                    <div className="flex justify-end">
                                        <Button onClick={() => setShowAddTask(true)} className="text-xs">
                                            <Plus size={14} className="mr-1" /> Add My Task
                                        </Button>
                                    </div>

                                    {/* Tasks grouped by status */}
                                    {TASK_STATUSES.map(status => {
                                        const tasksInStatus = selectedProject.tasks?.filter(t => t.status === status) || [];
                                        if (tasksInStatus.length === 0) return null;
                                        const config = STATUS_CONFIG[status];
                                        const Icon = config.icon;

                                        return (
                                            <div key={status}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon size={14} className={config.color} />
                                                    <span className={cn("text-xs font-bold", config.color)}>{config.label} ({tasksInStatus.length})</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {tasksInStatus.map(task => (
                                                        <div key={task.id} className="bg-muted/30 border border-border rounded-xl p-3">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
                                                                        "bg-muted-foreground": task.status === "TODO",
                                                                        "bg-blue-500": task.status === "IN_PROGRESS",
                                                                        "bg-amber-500": task.status === "REVIEW",
                                                                        "bg-emerald-500": task.status === "COMPLETED",
                                                                        "bg-red-500": task.status === "BLOCKED",
                                                                    })} />
                                                                    <span className="font-medium text-sm">{task.title}</span>
                                                                </div>
                                                                <Badge label={task.priority} />
                                                            </div>
                                                            {task.description && (
                                                                <p className="text-xs text-muted-foreground mb-2 line-clamp-1 pl-4">{task.description}</p>
                                                            )}
                                                            <div className="flex items-center justify-between pl-4">
                                                                <div className="flex items-center gap-2">
                                                                    {task.assignee ? (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold", getAvatarColor(task.assignee.name))}>
                                                                                {getInitials(task.assignee.name)}
                                                                            </div>
                                                                            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">Unassigned</span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                            <Calendar size={10} /> {formatDate(task.dueDate)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* Status change - only for own tasks or admin */}
                                                                {(task.assignee?.id === userId || isAdminOrHR) && (
                                                                    <select
                                                                        value={task.status}
                                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                                        className="text-[10px] bg-muted border border-border rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-primary/50"
                                                                    >
                                                                        {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                                                    </select>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!selectedProject.tasks || selectedProject.tasks.length === 0) && (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <ListTodo size={32} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm font-medium">No tasks yet</p>
                                            <p className="text-xs mt-1">Add your first task to get started</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* TEAM TAB */}
                            {activeTab === "team" && (() => {
                                const members = new Map<string, { name: string; role: string }>();
                                if (selectedProject.manager) {
                                    members.set(selectedProject.manager.id, { name: selectedProject.manager.name, role: "LEAD" });
                                }
                                selectedProject.tasks?.forEach(t => {
                                    if (t.assignee && !members.has(t.assignee.id)) {
                                        members.set(t.assignee.id, { name: t.assignee.name, role: "MEMBER" });
                                    }
                                });

                                return (
                                    <div className="space-y-2">
                                        {Array.from(members.entries()).map(([id, m]) => (
                                            <div key={id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold", getAvatarColor(m.name))}>
                                                        {getInitials(m.name)}
                                                    </div>
                                                    <span className="font-medium text-sm">{m.name}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                                                    m.role === "LEAD" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {m.role}
                                                </span>
                                            </div>
                                        ))}
                                        {members.size === 0 && (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <Users size={32} className="mx-auto mb-2 opacity-40" />
                                                <p className="text-sm">No team members yet</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            {showAddTask && selectedProject && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">Add Task</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Project: {selectedProject.name}</p>
                            </div>
                            <button onClick={() => setShowAddTask(false)} className="p-1 hover:bg-muted rounded-lg"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase text-muted-foreground">Task Title *</label>
                                <input
                                    required
                                    value={taskForm.title}
                                    onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="e.g. Design homepage layout"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase text-muted-foreground">Description</label>
                                <textarea
                                    rows={2}
                                    value={taskForm.description}
                                    onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Brief description of the task..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm"
                                    >
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Due Date</label>
                                    <input
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submitting} className="flex-1 justify-center">
                                    {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                                    Add Task
                                </Button>
                                <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1 justify-center">Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
