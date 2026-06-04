"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, Search, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function DesignationsClient({ initialData, departments, users }: { initialData: any[], departments: any[], users: any[] }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: designations = initialData } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await fetch("/api/organization/designations");
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
    name: "", departmentId: "", level: "", description: "", isActive: true
  };
  const [formData, setFormData] = useState(defaultForm);

  const levels = [
    { value: "L1", label: "L1 - Entry/Intern" },
    { value: "L2", label: "L2 - Junior" },
    { value: "L3", label: "L3 - Senior" },
    { value: "L4", label: "L4 - Lead/Principal" },
    { value: "L5", label: "L5 - Manager/Director" },
    { value: "L6", label: "L6 - VP/C-Level" },
  ];

  const saveMutation = useMutation({
    mutationFn: async (newDesig: typeof formData) => {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/organization/designations/${editingId}` : "/api/organization/designations";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDesig),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success(editingId ? "Designation updated successfully" : "Designation added successfully");
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save designation");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organization/designations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Designation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete designation");
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departmentId || !formData.level) return;
    saveMutation.mutate(formData);
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (desig: any) => {
    setFormData({
      name: desig.name || "",
      departmentId: desig.departmentId || "",
      level: desig.level || "",
      description: desig.description || "",
      isActive: desig.isActive ?? true
    });
    setEditingId(desig.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultForm);
    setEditingId(null);
  };

  const filteredDesignations = designations.filter((d: any) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.department?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.level || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ? true : 
                          statusFilter === "ACTIVE" ? d.isActive === true : d.isActive === false;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
        <h2 className="font-semibold text-card-foreground">All Designations</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search roles..." 
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
            Add Designation
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-card-foreground">{editingId ? "Edit Designation" : "Add New Designation"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Designation Title *</label>
                <input
                  type="text" required
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Senior Developer, HR Manager..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Department *</label>
                <select
                  required
                  value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Hierarchy Level *</label>
                <select
                  required
                  value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Level...</option>
                  {levels.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the role..."
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
                <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active Role</label>
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
                  {editingId ? "Update" : "Save"} Designation
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
              <th className="px-6 py-4 font-medium">Designation</th>
              <th className="px-6 py-4 font-medium">Level</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Employees</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filteredDesignations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No designations found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredDesignations.map((desig: any) => (
                <tr key={desig.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{desig.name}</div>
                    {desig.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{desig.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {desig.level ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-bold border border-border shadow-sm">
                        {desig.level}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{desig.department?.name || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{desig._count?.users || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${desig.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {desig.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(desig)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { if (confirm("Are you sure you want to delete this designation?")) deleteMutation.mutate(desig.id); }} 
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
