"use client";

import { useState } from "react";
import { Plus, Loader2, Check, X, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";

type TransfersClientProps = {
  employees: any[];
  branches: any[];
  departments: any[];
  teams: any[];
};

export default function TransfersClient({ employees, branches, departments, teams }: TransfersClientProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const res = await fetch("/api/organization/transfers");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/organization/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success("Transfer requested successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/organization/transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success("Transfer status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setEmployeeId("");
    setNewBranchId("");
    setNewDepartmentId("");
    setNewTeamId("");
    setEffectiveDate("");
    setReason("");
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !effectiveDate) {
      return toast.error("Employee and Effective Date are required");
    }
    requestMutation.mutate({ employeeId, newBranchId, newDepartmentId, newTeamId, effectiveDate, reason });
  };

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const filteredTeams = teams.filter(t => !newDepartmentId || t.departmentId === newDepartmentId);

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
          Request Transfer
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Movement</th>
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
              ) : transfers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <ArrowRightLeft size={32} className="mx-auto mb-3 opacity-20" />
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers?.map((transfer: any) => (
                  <tr key={transfer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", getAvatarColor(transfer.employee.name))}>
                          {getInitials(transfer.employee.name)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{transfer.employee.name}</div>
                          <div className="text-[10px] text-muted-foreground">{transfer.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {transfer.newDepartmentId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through opacity-70 w-24 truncate">{transfer.oldDepartmentName || "None"}</span>
                            <ArrowRightLeft size={12} className="text-primary flex-shrink-0" />
                            <span className="font-medium w-24 truncate text-foreground">{transfer.newDepartmentName}</span>
                          </div>
                        )}
                        {transfer.newTeamId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through opacity-70 w-24 truncate">{transfer.oldTeamName || "None"}</span>
                            <ArrowRightLeft size={12} className="text-primary flex-shrink-0" />
                            <span className="font-medium w-24 truncate text-foreground">{transfer.newTeamName}</span>
                          </div>
                        )}
                        {transfer.newBranchId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through opacity-70 w-24 truncate">{transfer.oldBranchName || "None"}</span>
                            <ArrowRightLeft size={12} className="text-primary flex-shrink-0" />
                            <span className="font-medium w-24 truncate text-foreground">{transfer.newBranchName}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground">{new Date(transfer.effectiveDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        transfer.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        transfer.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {transfer.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => actionMutation.mutate({ id: transfer.id, status: "APPROVED" })}
                            disabled={actionMutation.isPending}
                            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-md transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => actionMutation.mutate({ id: transfer.id, status: "REJECTED" })}
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
              <h2 className="font-display font-bold text-lg">Request Transfer</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="transfer-form" onSubmit={handleRequest} className="space-y-4">
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
                    <div className="font-medium mb-2 text-muted-foreground uppercase tracking-wider">Current Assignment</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="opacity-70">Branch:</span> {branches.find(b => b.id === selectedEmployee.branchId)?.name || "—"}</div>
                      <div><span className="opacity-70">Department:</span> {departments.find(d => d.id === selectedEmployee.departmentId)?.name || "—"}</div>
                      <div><span className="opacity-70">Team:</span> {teams.find(t => t.id === selectedEmployee.teamId)?.name || "—"}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">New Branch</label>
                    <select 
                      value={newBranchId} 
                      onChange={(e) => setNewBranchId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                      <option value="">Keep current branch...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">New Department</label>
                    <select 
                      value={newDepartmentId} 
                      onChange={(e) => { setNewDepartmentId(e.target.value); setNewTeamId(""); }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                      <option value="">Keep current department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">New Team</label>
                  <select 
                    value={newTeamId} 
                    onChange={(e) => setNewTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    <option value="">Keep current team...</option>
                    {filteredTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
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
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reason for Transfer</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g., Requested by manager, Internal mobility..."
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
                form="transfer-form"
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
