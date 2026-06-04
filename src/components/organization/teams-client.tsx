"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, Search, X, Pencil, Eye } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TeamsClient({ initialData, departments, branches, users }: { initialData: any[], departments: any[], branches: any[], users: any[] }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: teams = initialData } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch("/api/organization/teams");
      const json = await res.json();
      return json.data;
    },
    initialData,
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form State
  const defaultForm = {
    name: "", code: "", departmentId: "", branchId: "", description: "", leadId: "", maxMembers: "", isActive: true
  };
  const [formData, setFormData] = useState(defaultForm);

  const saveMutation = useMutation({
    mutationFn: async (newTeam: typeof formData) => {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/organization/teams/${editingId}` : "/api/organization/teams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success(editingId ? "Team updated successfully" : "Team added successfully");
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save team");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organization/teams/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Team deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete team");
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId) return;
    saveMutation.mutate(formData);
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (team: any) => {
    setFormData({
      name: team.name || "",
      code: team.code || "",
      departmentId: team.departmentId || "",
      branchId: team.branchId || "",
      description: team.description || "",
      leadId: team.leadId || "",
      maxMembers: team.maxMembers ? team.maxMembers.toString() : "",
      isActive: team.isActive ?? true
    });
    setEditingId(team.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultForm);
    setEditingId(null);
  };

  const filteredTeams = teams.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "ACTIVE" && t.isActive) || 
                          (statusFilter === "INACTIVE" && !t.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
        <h2 className="font-semibold text-card-foreground">All Teams</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            Add Team
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-card-foreground">{editingId ? "Edit Team" : "Add New Team"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Team Name *</label>
                  <input
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Frontend Team..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Team Code *</label>
                  <input
                    type="text" required
                    value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g. TM-FRNT-01"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch</label>
                  <select
                    value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value, departmentId: ""})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Department...</option>
                    {departments
                      .filter((d: any) => !formData.branchId || !d.branchId || d.branchId === formData.branchId)
                      .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Team Lead</label>
                  <select
                    value={formData.leadId} onChange={(e) => setFormData({...formData, leadId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Lead...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Max Members</label>
                  <input
                    type="number" min="1"
                    value={formData.maxMembers} onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What is this team responsible for?"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-input text-primary focus:ring-primary/20"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active Team</label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-background border border-input text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? "Update" : "Save"} Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Team</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Branch / Department</th>
              <th className="px-6 py-4 font-medium">Lead</th>
              <th className="px-6 py-4 font-medium">Members</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No teams found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team: any) => (
                <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{team.name}</div>
                    {team.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{team.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-foreground font-mono text-xs">{team.code || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="text-foreground">{team.department?.name || "—"}</div>
                    {team.branch?.name && <div className="text-xs text-muted-foreground mt-0.5">{team.branch.name}</div>}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {team.lead?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {team.lead.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-muted-foreground">{team._count?.users || 0} {team.maxMembers ? `/ ${team.maxMembers}` : ''}</div>
                    {team.maxMembers && team._count?.users >= (team.maxMembers * 0.8) && (
                      <div className="text-[10px] text-amber-500 font-medium mt-1">Near Capacity</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${team.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {team.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/organization/teams/${team.id}`} className="text-muted-foreground hover:text-primary transition-colors p-1" title="View Dashboard">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => openEditModal(team)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { if (confirm("Are you sure you want to delete this team?")) deleteMutation.mutate(team.id); }} 
                        disabled={deleteMutation.isPending} 
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
