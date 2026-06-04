"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FolderKanban, Plus, Search, RefreshCw, Edit, Trash2,
    ChevronLeft, ChevronRight, X, Loader2, Calendar,
    PlayCircle, CheckCircle, AlertCircle, Clock, Users,
    MoreVertical, User
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Button, EmptyState } from "@/components/ui/shared";
import { StatsCard } from "@/components/ui/stats-card";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "BLOCKED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    assigneeId: string | null;
    dueDate: string | null;
    createdAt: string;
    assignee: {
        id: string;
        name: string;
        profileImage: string | null;
    } | null;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    startDate: string | null;
    endDate: string | null;
    managerId: string;
    createdAt: string;
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
    tasks: Task[];
}

interface Employee {
    id: string;
    name: string;
    email: string;
}

interface Props {
    userRole: string;
    userId: string;
}

export default function ProjectsClient({ userRole, userId }: Props) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modals state
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        budget: 0,
        startDate: "",
        endDate: "",
        managerId: userId,
        teamMemberIds: [] as string[]
    });
    const [submitting, setSubmitting] = useState(false);

    // Detail Modal State
    const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team">("overview");
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState({
        id: "",
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: ""
    });

    const isAdminOrHR = ["ADMIN", "HR"].includes(userRole);

    const fetchProjects = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch(`/api/projects${statusFilter ? `?status=${statusFilter}` : ""}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch projects");
            setProjects(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [statusFilter]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch(`/api/employees?limit=100`);
            const data = await res.json();
            if (res.ok && data.users) {
                setEmployees(data.users);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
        if (isAdminOrHR) {
            fetchEmployees();
        }
    }, [fetchProjects, fetchEmployees, isAdminOrHR]);

    // Derived Stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
    const completedProjects = projects.filter(p => p.status === "COMPLETED").length;
    const overdueProjects = projects.filter(p => {
        if (!p.endDate || p.status === "COMPLETED") return false;
        return new Date(p.endDate) < new Date();
    }).length;

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = selectedProject ? `/api/projects/${selectedProject.id}` : `/api/projects`;
            const method = selectedProject ? "PATCH" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(selectedProject ? "Project updated" : "Project created");
            setShowCreateModal(false);
            fetchProjects(false);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project? All tasks will be deleted.")) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete project");
            setSuccess("Project deleted");
            setShowProjectModal(false);
            fetchProjects(false);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const isUpdate = !!taskForm.id;
            const url = isUpdate ? `/api/tasks/${taskForm.id}` : `/api/tasks`;
            const method = isUpdate ? "PATCH" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...taskForm,
                    projectId: selectedProject?.id
                }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(isUpdate ? "Task updated" : "Task added");
            setShowTaskForm(false);
            
            // Refetch specific project to update modal
            if (selectedProject) {
                const projRes = await fetch(`/api/projects/${selectedProject.id}`);
                if (projRes.ok) {
                    const updatedProj = await projRes.json();
                    setSelectedProject(updatedProj);
                    
                    // Also update in list
                    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
                }
            }
            
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openProjectModal = async (project: Project) => {
        // Fetch full details
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedProject(data);
                setActiveTab("overview");
                setShowProjectModal(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getProgress = (tasks: Task[]) => {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === "COMPLETED").length;
        return Math.round((completed / tasks.length) * 100);
    };

    const getStatusCounts = (tasks: Task[]) => {
        const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0, BLOCKED: 0 };
        tasks?.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
        return counts;
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

    return (
        <div className="space-y-6">
            {(error || success) && (
                <div className={cn("p-4 rounded-xl text-sm flex items-center justify-between",
                    success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                )}>
                    <div className="flex items-center gap-2">
                        {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {error || success}
                    </div>
                    <button onClick={() => { setError(""); setSuccess(""); }}><X size={14} /></button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="TOTAL PROJECTS" value={totalProjects} icon={FolderKanban} color="blue" />
                <StatsCard title="ACTIVE" value={activeProjects} icon={PlayCircle} color="green" />
                <StatsCard title="COMPLETED" value={completedProjects} icon={CheckCircle} color="purple" />
                <StatsCard title="OVERDUE" value={overdueProjects} icon={AlertCircle} color="red" />
            </div>

            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1 max-w-md">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Status</option>
                        <option value="PLANNING">Planning</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                    </select>

                    {isAdminOrHR && (
                        <button 
                            onClick={() => { 
                                setSelectedProject(null); 
                                setCreateForm({ name: "", description: "", status: "PLANNING", budget: 0, startDate: "", endDate: "", managerId: userId, teamMemberIds: [] }); 
                                setShowCreateModal(true); 
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    )}
                </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse border border-border" />
                    ))
                ) : filteredProjects.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState icon={FolderKanban} title="No projects found" description="Create a new project to get started." />
                    </div>
                ) : (
                    filteredProjects.map((project) => {
                        const progress = getProgress(project.tasks);
                        const statusCounts = getStatusCounts(project.tasks);
                        const team = getProjectTeam(project);
                        const teamDisplay = team.slice(0, 4);
                        const extraTeam = team.length > 4 ? team.length - 4 : 0;

                        return (
                            <div 
                                key={project.id}
                                onClick={() => openProjectModal(project)}
                                className="group relative p-5 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{project.description || "No description"}</p>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1",
                                        project.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
                                        project.status === "COMPLETED" ? "bg-purple-500/10 text-purple-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>
                                        {project.status === "ACTIVE" && <PlayCircle size={10} />}
                                        {project.status === "COMPLETED" && <CheckCircle size={10} />}
                                        {project.status}
                                    </span>
                                </div>

                                <div className="my-4">
                                    <div className="flex justify-between text-xs font-semibold mb-2">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="text-blue-500">{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
                                    <div className="bg-muted/50 p-2 rounded-lg text-center">
                                        <div className="font-bold text-foreground">{statusCounts.TODO}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Todo</div>
                                    </div>
                                    <div className="bg-muted/50 p-2 rounded-lg text-center">
                                        <div className="font-bold text-blue-500">{statusCounts.IN_PROGRESS}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">In Progress</div>
                                    </div>
                                    <div className="bg-muted/50 p-2 rounded-lg text-center">
                                        <div className="font-bold text-emerald-500">{statusCounts.COMPLETED}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Done</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex -space-x-2">
                                        {team.length === 0 ? (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Unassigned</span>
                                        ) : (
                                            <>
                                                {teamDisplay.map((member, idx) => (
                                                    <div 
                                                        key={member.id} 
                                                        className="w-7 h-7 rounded-full border-2 border-card bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold"
                                                        title={member.name}
                                                    >
                                                        {member.name[0]}
                                                    </div>
                                                ))}
                                                {extraTeam > 0 && (
                                                    <div className="w-7 h-7 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                                                        +{extraTeam}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Users size={12} /> {team.length} members
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-xl flex items-center gap-2">🚀 {selectedProject ? "Edit Project" : "Create New Project"}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-muted rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Project Name *</label>
                                <input required value={createForm.name} onChange={e => setCreateForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Website Redesign 2025" className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="Project overview and goals..." className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Status</label>
                                    <select value={createForm.status} onChange={e => setCreateForm(p => ({...p, status: e.target.value}))} className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none">
                                        <option value="PLANNING">Planning</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ON_HOLD">On Hold</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Budget (₹)</label>
                                    <input type="number" min="0" value={createForm.budget} onChange={e => setCreateForm(p => ({...p, budget: parseFloat(e.target.value) || 0}))} className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Start Date *</label>
                                    <input required type="date" value={createForm.startDate} onChange={e => setCreateForm(p => ({...p, startDate: e.target.value}))} className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">End Date</label>
                                    <input type="date" value={createForm.endDate} onChange={e => setCreateForm(p => ({...p, endDate: e.target.value}))} className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Project Manager</label>
                                <select value={createForm.managerId} onChange={e => setCreateForm(p => ({...p, managerId: e.target.value}))} className="w-full p-2.5 bg-muted/50 border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none">
                                    <option value="">Select manager...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Team Members</label>
                                <div className="max-h-40 overflow-y-auto bg-muted/30 border border-border rounded-xl p-2 space-y-1">
                                    {employees.map(e => (
                                        <label key={e.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={createForm.teamMemberIds.includes(e.id)}
                                                    onChange={(ev) => {
                                                        if (ev.target.checked) {
                                                            setCreateForm(p => ({ ...p, teamMemberIds: [...p.teamMemberIds, e.id] }));
                                                        } else {
                                                            setCreateForm(p => ({ ...p, teamMemberIds: p.teamMemberIds.filter(id => id !== e.id) }));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px] font-bold">
                                                    {e.name[0]}
                                                </div>
                                                <span className="font-medium text-sm">{e.name}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground hidden sm:block">Employee</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="submit" disabled={submitting} className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white">{submitting ? <Loader2 className="animate-spin" /> : (selectedProject ? "Update Project" : "Create Project")}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Project Details Modal */}
            {showProjectModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border bg-muted/20">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 uppercase">{selectedProject.status}</span>
                                    <h2 className="text-2xl font-bold mt-2">{selectedProject.name}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedProject.description || "No description provided."}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAdminOrHR && (
                                        <button onClick={() => {
                                            setCreateForm({
                                                name: selectedProject.name,
                                                description: selectedProject.description || "",
                                                status: selectedProject.status,
                                                budget: 0,
                                                startDate: selectedProject.startDate ? selectedProject.startDate.split('T')[0] : "",
                                                endDate: selectedProject.endDate ? selectedProject.endDate.split('T')[0] : "",
                                                managerId: selectedProject.managerId,
                                                teamMemberIds: selectedProject.members?.map(m => m.id) || []
                                            });
                                            setShowCreateModal(true);
                                        }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                                            <Edit size={14} /> Edit
                                        </button>
                                    )}
                                    <button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X size={20} /></button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Overall Progress</span>
                                <span className="font-bold">{getProgress(selectedProject.tasks)}% • {selectedProject.tasks.filter(t => t.status==="COMPLETED").length}/{selectedProject.tasks.length} tasks</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${getProgress(selectedProject.tasks)}%` }} />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-6 px-6 border-b border-border">
                            {[
                                { id: "overview", label: "Overview", icon: FolderKanban },
                                { id: "tasks", label: `Tasks (${selectedProject.tasks.length})`, icon: CheckCircle },
                                { id: "team", label: `Team (${getProjectTeam(selectedProject).length})`, icon: Users },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-colors",
                                        activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
                                            <div className="text-2xl font-bold text-foreground">{selectedProject.tasks.length}</div>
                                            <div className="text-xs text-muted-foreground uppercase">Total Tasks</div>
                                        </div>
                                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center">
                                            <div className="text-2xl font-bold text-emerald-500">{selectedProject.tasks.filter(t => t.status === "COMPLETED").length}</div>
                                            <div className="text-xs text-emerald-600 uppercase">Completed</div>
                                        </div>
                                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                                            <div className="text-2xl font-bold text-blue-500">{selectedProject.tasks.filter(t => t.status === "IN_PROGRESS").length}</div>
                                            <div className="text-xs text-blue-600 uppercase">In Progress</div>
                                        </div>
                                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center">
                                            <div className="text-2xl font-bold text-red-500">{selectedProject.tasks.filter(t => t.status === "BLOCKED").length}</div>
                                            <div className="text-xs text-red-600 uppercase">Blocked</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-4">Task Status Breakdown</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: "To Do", status: "TODO", color: "bg-muted-foreground" },
                                                { label: "In Progress", status: "IN_PROGRESS", color: "bg-blue-500" },
                                                { label: "In Review", status: "REVIEW", color: "bg-purple-500" },
                                                { label: "Completed", status: "COMPLETED", color: "bg-emerald-500" },
                                                { label: "Blocked", status: "BLOCKED", color: "bg-red-500" }
                                            ].map(item => {
                                                const count = selectedProject.tasks.filter(t => t.status === item.status).length;
                                                const percent = selectedProject.tasks.length > 0 ? Math.round((count / selectedProject.tasks.length) * 100) : 0;
                                                return (
                                                    <div key={item.status} className="flex items-center gap-4 text-sm">
                                                        <div className="w-24 text-muted-foreground flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${item.color}`} /> {item.label}</div>
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full ${item.color}`} style={{ width: `${percent}%` }} />
                                                        </div>
                                                        <div className="w-24 text-right text-xs text-muted-foreground">{count} tasks ({percent}%)</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                            <div className="text-xs text-muted-foreground mb-1">Manager</div>
                                            <div className="font-medium flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                                                    {selectedProject.manager.name[0]}
                                                </div>
                                                {selectedProject.manager.name}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                            <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                                            <div className="font-medium text-sm">
                                                {selectedProject.startDate ? formatDate(selectedProject.startDate, "dd MMM yyyy") : "--"} 
                                                <span className="mx-2 text-muted-foreground">→</span> 
                                                {selectedProject.endDate ? formatDate(selectedProject.endDate, "dd MMM yyyy") : "--"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "tasks" && (
                                <div className="space-y-4">
                                    <div className="flex justify-end mb-4">
                                        {isAdminOrHR && (
                                            <Button onClick={() => {
                                                setTaskForm({ id: "", title: "", description: "", status: "TODO", priority: "MEDIUM", assigneeId: "", dueDate: "" });
                                                setShowTaskForm(true);
                                            }} size="sm"><Plus size={14} className="mr-1" /> Add Task</Button>
                                        )}
                                    </div>

                                    {showTaskForm && (
                                        <div className="p-4 bg-muted/30 border border-border rounded-xl mb-4 animate-in slide-in-from-top-4">
                                            <h4 className="font-semibold text-sm mb-3">{taskForm.id ? "Edit Task" : "New Task"}</h4>
                                            <form onSubmit={handleSaveTask} className="space-y-3">
                                                <input required value={taskForm.title} onChange={e => setTaskForm(p => ({...p, title: e.target.value}))} placeholder="Task title" className="w-full p-2 text-sm bg-background border border-border rounded-lg" />
                                                <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({...p, description: e.target.value}))} placeholder="Description (optional)" className="w-full p-2 text-sm bg-background border border-border rounded-lg" rows={2} />
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <select value={taskForm.status} onChange={e => setTaskForm(p => ({...p, status: e.target.value}))} className="p-2 text-sm bg-background border border-border rounded-lg">
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="REVIEW">In Review</option>
                                                        <option value="COMPLETED">Completed</option>
                                                        <option value="BLOCKED">Blocked</option>
                                                    </select>
                                                    <select value={taskForm.priority} onChange={e => setTaskForm(p => ({...p, priority: e.target.value}))} className="p-2 text-sm bg-background border border-border rounded-lg">
                                                        <option value="LOW">Low</option>
                                                        <option value="MEDIUM">Medium</option>
                                                        <option value="HIGH">High</option>
                                                        <option value="URGENT">Urgent</option>
                                                    </select>
                                                    <select value={taskForm.assigneeId} onChange={e => setTaskForm(p => ({...p, assigneeId: e.target.value}))} className="p-2 text-sm bg-background border border-border rounded-lg">
                                                        <option value="">Unassigned</option>
                                                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                    </select>
                                                    <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({...p, dueDate: e.target.value}))} className="p-2 text-sm bg-background border border-border rounded-lg" />
                                                </div>
                                                <div className="flex gap-2 justify-end pt-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                                                    <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving..." : "Save Task"}</Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {selectedProject.tasks.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">No tasks created yet.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedProject.tasks.map(task => (
                                                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0",
                                                            task.status === "COMPLETED" ? "bg-emerald-500 border-emerald-500" :
                                                            task.status === "IN_PROGRESS" ? "border-blue-500" :
                                                            task.status === "BLOCKED" ? "bg-red-500 border-red-500" : "border-muted-foreground"
                                                        )} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{task.title}</span>
                                                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", 
                                                                    task.priority === "URGENT" || task.priority === "HIGH" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                                                                )}>{task.priority}</span>
                                                            </div>
                                                            {task.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</div>}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-xs ml-7 sm:ml-0">
                                                        <div className="flex items-center gap-1.5 w-24">
                                                            {task.assignee ? (
                                                                <>
                                                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">
                                                                        {task.assignee.name[0]}
                                                                    </div>
                                                                    <span className="truncate" title={task.assignee.name}>{task.assignee.name.split(' ')[0]}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-muted-foreground">Unassigned</span>
                                                            )}
                                                        </div>
                                                        <div className="w-24 text-muted-foreground">
                                                            {task.dueDate ? formatDate(task.dueDate, "dd MMM") : "No due date"}
                                                        </div>
                                                        <div className="w-24">
                                                            <span className={cn("px-2 py-1 rounded text-[10px] font-bold",
                                                                task.status === "TODO" ? "bg-muted text-muted-foreground" :
                                                                task.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-500" :
                                                                task.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                                                                task.status === "BLOCKED" ? "bg-red-500/10 text-red-500" : "bg-purple-500/10 text-purple-500"
                                                            )}>{task.status.replace("_", " ")}</span>
                                                        </div>
                                                        {isAdminOrHR && (
                                                            <button onClick={() => {
                                                                setTaskForm({
                                                                    id: task.id,
                                                                    title: task.title,
                                                                    description: task.description || "",
                                                                    status: task.status,
                                                                    priority: task.priority,
                                                                    assigneeId: task.assigneeId || "",
                                                                    dueDate: task.dueDate ? task.dueDate.split('T')[0] : ""
                                                                });
                                                                setShowTaskForm(true);
                                                            }} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors">
                                                                <Edit size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "team" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getProjectTeam(selectedProject).map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                                {member.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{member.name}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                                {member.id === selectedProject.managerId && (
                                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500 uppercase">Project Manager</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
