"use client";

import { useState } from "react";
import { Plus, Loader2, Check, X, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";

type PromotionsClientProps = {
  employees: any[];
  designations: any[];
};

export default function PromotionsClient({ employees, designations }: PromotionsClientProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [newDesignationId, setNewDesignationId] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await fetch("/api/organization/promotions");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/organization/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success("Promotion requested successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/organization/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success("Promotion status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setEmployeeId("");
    setNewDesignationId("");
    setNewLevel("");
    setNewSalary("");
    setEffectiveDate("");
    setReason("");
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !newDesignationId || !effectiveDate) {
      return toast.error("Employee, Designation, and Effective Date are required");
    }
    requestMutation.mutate({ employeeId, newDesignationId, newLevel, newSalary, effectiveDate, reason });
  };

  const selectedEmployee = employees.find(e => e.id === employeeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* Filters could go here */}
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Request Promotion
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Promotion Details</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Effective Date</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : promotions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <TrendingUp size={32} className="mx-auto mb-3 opacity-20" />
                    No promotions found
                  </td>
                </tr>
              ) : (
                promotions?.map((promotion: any) => (
                  <tr key={promotion.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", getAvatarColor(promotion.employee.name))}>
                          {getInitials(promotion.employee.name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{promotion.employee.name}</div>
                          <div className="text-[10px] text-muted-foreground">{promotion.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through opacity-70 w-24 truncate">{promotion.oldDesignationName || "None"}</span>
                          <TrendingUp size={12} className="text-primary flex-shrink-0" />
                          <span className="font-medium w-32 truncate text-foreground">{promotion.newDesignationName}</span>
                        </div>
                        {promotion.newSalary && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground w-24 truncate">Salary:</span>
                            <span className="text-primary flex-shrink-0 w-3 h-3" />
                            <span className="font-medium w-32 truncate text-foreground">${promotion.newSalary}</span>
                          </div>
                        )}
                        {promotion.newLevel && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-24 truncate">Level:</span>
                            <span className="text-primary flex-shrink-0 w-3 h-3" />
                            <span className="font-medium w-32 truncate text-foreground">{promotion.newLevel}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground">{new Date(promotion.effectiveDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        promotion.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        promotion.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {promotion.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {promotion.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => actionMutation.mutate({ id: promotion.id, status: "APPROVED" })}
                            disabled={actionMutation.isPending}
                            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-md transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => actionMutation.mutate({ id: promotion.id, status: "REJECTED" })}
                            disabled={actionMutation.isPending}
                            className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-md transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="font-display font-bold text-lg">Request Promotion</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="promotion-form" onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Employee <span className="text-red-500">*</span></label>
                  <select 
                    value={employeeId} 
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    required
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 mb-4 border border-border">
                    <div className="font-medium mb-2 text-muted-foreground uppercase tracking-wider">Current Role</div>
                    <div><span className="opacity-70">Designation:</span> {designations.find(d => d.id === selectedEmployee.designationId)?.name || "—"}</div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">New Designation <span className="text-red-500">*</span></label>
                  <select 
                    value={newDesignationId} 
                    onChange={(e) => setNewDesignationId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    required
                  >
                    <option value="">Select Designation...</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">New Level</label>
                    <input 
                      type="text"
                      placeholder="e.g., L3, Senior"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">New Salary (Monthly)</label>
                    <input 
                      type="number"
                      placeholder="e.g., 5000"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Effective Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reason for Promotion</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g., Outstanding performance, Annual review..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm min-h-[80px] resize-y"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3 sticky bottom-0">
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="promotion-form"
                disabled={requestMutation.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {requestMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
