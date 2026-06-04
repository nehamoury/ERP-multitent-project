"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, Search, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BranchesClient({ initialData, users }: { initialData: any[], users: any[] }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: branches = initialData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch("/api/organization/branches");
      const json = await res.json();
      return json.data;
    },
    initialData,
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  // Form State
  const defaultForm = {
    name: "", code: "", address: "", city: "", state: "", country: "", contactPerson: "", contactNumber: "", managerId: "", isActive: true
  };
  const [formData, setFormData] = useState(defaultForm);

  const saveMutation = useMutation({
    mutationFn: async (newBranch: typeof formData) => {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/organization/branches/${editingId}` : "/api/organization/branches";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success(editingId ? "Branch updated successfully" : "Branch added successfully");
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save branch");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organization/branches/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Branch deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete branch");
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

  const openEditModal = (branch: any) => {
    setFormData({
      name: branch.name || "",
      code: branch.code || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      country: branch.country || "",
      contactPerson: branch.contactPerson || "",
      contactNumber: branch.contactNumber || "",
      managerId: branch.managerId || "",
      isActive: branch.isActive ?? true
    });
    setEditingId(branch.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(defaultForm);
    setEditingId(null);
  };

  const filteredBranches = branches.filter((b: any) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "ACTIVE" && b.isActive) || 
                          (statusFilter === "INACTIVE" && !b.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
        <h2 className="font-semibold text-card-foreground">All Branches</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search branches..." 
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
            Add Branch
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-card-foreground">{editingId ? "Edit Branch" : "Add New Branch"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Name *</label>
                  <input
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Raipur Branch"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g. RPR01"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Manager</label>
                  <select
                    value={formData.managerId} onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Manager...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Street address"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-input text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active Branch</label>
                </div>
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
                  {editingId ? "Update" : "Save"} Branch
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
              <th className="px-6 py-4 font-medium">Branch</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Manager</th>
              <th className="px-6 py-4 font-medium">Employees</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filteredBranches.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No branches found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch: any) => (
                <tr key={branch.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{branch.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{branch.city ? `${branch.city}, ${branch.state}` : 'No address'}</div>
                  </td>
                  <td className="px-6 py-4 text-foreground">{branch.code || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {branch.manager?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {branch.manager.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{branch._count?.users || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${branch.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(branch)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { if (confirm("Are you sure you want to delete this branch?")) deleteMutation.mutate(branch.id); }} 
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
