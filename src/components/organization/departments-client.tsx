"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, Search, X, Pencil, Eye } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function DepartmentsClient({ initialData, users, branches = [], allDepartments = [] }: { initialData: any[], users: any[], branches?: any[], allDepartments?: any[] }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: departments = initialData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch("/api/organization/departments");
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
    name: "", code: "", description: "", headId: "", branchId: "", parentDepartmentId: "", isActive: true
  };
  const [formData, setFormData] = useState(defaultForm);

  const saveMutation = useMutation({
    mutationFn: async (newDept: typeof formData) => {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/organization/departments/${editingId}` : "/api/organization/departments";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success(editingId ? "Department updated successfully" : "Department added successfully");
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save department");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organization/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Department deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete department");
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    saveMutation.mutate(formData);
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setFormData({
      name: dept.name || "",
      code: dept.code || "",
      description: dept.description || "",
      headId: dept.headId || "",
      branchId: dept.branchId || "",
      parentDepartmentId: dept.parentDepartmentId || "",
      isActive: dept.isActive ?? true
    });
    setEditingId(dept.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultForm);
    setEditingId(null);
  };

  const filteredDepartments = departments.filter((d: any) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "ACTIVE" && d.isActive) || 
                          (statusFilter === "INACTIVE" && !d.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
        <h2 className="font-semibold text-card-foreground">All Departments</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search departments..." 
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
            Add Department
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-card-foreground">{editingId ? "Edit Department" : "Add New Department"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Department Name *</label>
                <input
                  type="text" required
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Department Code</label>
                <input
                  type="text"
                  value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g. ENG"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Department Head</label>
                <select
                  value={formData.headId} onChange={(e) => setFormData({...formData, headId: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Head...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch</label>
                  <select
                    value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Parent Department</label>
                  <select
                    value={formData.parentDepartmentId} onChange={(e) => setFormData({...formData, parentDepartmentId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">None (Top Level)</option>
                    {allDepartments.filter(d => d.id !== editingId).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What does this department do?"
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
                <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active Department</label>
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
                  {editingId ? "Update" : "Save"} Department
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
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Branch</th>
              <th className="px-6 py-4 font-medium">Head</th>
              <th className="px-6 py-4 font-medium">Teams</th>
              <th className="px-6 py-4 font-medium">Employees</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No departments found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept: any) => (
                <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{dept.name}</div>
                    {dept.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{dept.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-foreground">{dept.code || "—"}</td>
                  <td className="px-6 py-4 text-foreground">{dept.branch?.name || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {dept.head?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {dept.head.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{dept._count?.teams || 0}</td>
                  <td className="px-6 py-4 text-muted-foreground">{dept._count?.users || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${dept.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/organization/departments/${dept.id}`} className="text-muted-foreground hover:text-primary transition-colors p-1" title="View Dashboard">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => openEditModal(dept)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { if (confirm("Are you sure you want to delete this department?")) deleteMutation.mutate(dept.id); }} 
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
