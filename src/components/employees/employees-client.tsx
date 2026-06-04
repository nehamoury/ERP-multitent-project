// src/components/employees/employees-client.tsx
"use client";

import { useState, useCallback } from "react";
import { Search, Plus, RefreshCw, Edit, UserCheck, UserX, ChevronLeft, ChevronRight, X, Loader2, Save, Eye } from "lucide-react";
import Link from "next/link";
import { getInitials, getAvatarColor, getRoleBadge, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button, RoleBadge, Badge, EmptyState } from "@/components/ui/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Employee {
  id: string; employeeId: string; name: string; email: string;
  role: string; 
  branch: { name: string } | null;
  department: { name: string } | null; 
  designation: { name: string } | null;
  team: { name: string } | null;
  reportingManager: { name: string } | null;
  phone: string | null; isActive: boolean; joinDate: string;
  fathersName: string | null; address: string | null; linkedInUrl: string | null;
  dateOfBirth: string | null; gender: string | null;
  shiftStart: string; shiftEnd: string;
  _count: { attendance: number };
}

const ROLES = ["EMPLOYEE", "HR", "ADMIN"];

export default function EmployeesClient() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading: loading, isFetching, error: fetchError } = useQuery({
    queryKey: ['employees', page, search, dept, branchFilter, teamFilter, designationFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (dept) params.set("dept", dept);
      if (branchFilter) params.set("branchId", branchFilter);
      if (teamFilter) params.set("teamId", teamFilter);
      if (designationFilter) params.set("designationId", designationFilter);
      if (statusFilter) params.set("isActive", statusFilter);
      const res = await fetch(`/api/employees?${params}`);
      return res.json();
    }
  });

  const employees: Employee[] = data?.users || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const { data: metaData } = useQuery({
    queryKey: ['org-meta'],
    queryFn: async () => {
      const res = await fetch("/api/organization/meta");
      return res.json();
    }
  });

  const meta: { branches: any[], departments: any[], teams: any[], designations: any[], managers: any[] } = metaData?.success ? metaData.data : {
    branches: [], departments: [], teams: [], designations: [], managers: []
  };

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [limitModal, setLimitModal] = useState({ show: false, planName: "FREE", used: 0, limit: 0 });

  // Edit modal
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // View detail modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "EMPLOYEE",
    branchId: "", departmentId: "", teamId: "", designationId: "", managerId: "", phone: "",
    joinDate: new Date().toISOString().split("T")[0],
    shiftStart: "09:00", shiftEnd: "18:00",
    fathersName: "", address: "", linkedInUrl: "", dateOfBirth: "", gender: "",
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const addMutation = useMutation({
    mutationFn: async (newEmp: typeof form) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") throw data;
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      showSuccess("Employee added successfully!");
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setForm({
        name: "", email: "", password: "", role: "EMPLOYEE",
        branchId: "", departmentId: "", teamId: "", designationId: "", managerId: "", phone: "",
        joinDate: new Date().toISOString().split("T")[0],
        shiftStart: "09:00", shiftEnd: "18:00",
        fathersName: "", address: "", linkedInUrl: "", dateOfBirth: "", gender: "",
      });
    },
    onError: (err: any) => {
      if (err.code === "LIMIT_REACHED") {
        setShowModal(false);
        setLimitModal({ show: true, planName: err.planName, used: err.used, limit: err.limit });
      } else {
        setError(err.message || "An error occurred");
      }
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    addMutation.mutate(form);
  };

  // Open edit modal
  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setEditForm({
      name: emp.name,
      role: emp.role,
      branchId: emp.branch ? (meta.branches.find(b => b.name === emp.branch!.name)?.id || "") : "",
      departmentId: emp.department ? (meta.departments.find(d => d.name === emp.department!.name)?.id || "") : "",
      teamId: emp.team ? (meta.teams.find(t => t.name === emp.team!.name)?.id || "") : "",
      designationId: emp.designation ? (meta.designations.find(d => d.name === emp.designation!.name)?.id || "") : "",
      managerId: emp.reportingManager ? (meta.managers.find(m => m.name === emp.reportingManager!.name)?.id || "") : "",
      phone: emp.phone || "",
      shiftStart: emp.shiftStart,
      shiftEnd: emp.shiftEnd,
      fathersName: emp.fathersName || "",
      address: emp.address || "",
      linkedInUrl: emp.linkedInUrl || "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
      gender: emp.gender || "",
    });
    setEditError("");
    setSelectedEmployee(null);
  };

  const editMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editEmployee?.id, ...updateData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      showSuccess(`${editEmployee?.name} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditEmployee(null);
    },
    onError: (err: any) => setEditError(err.message)
  });

  // Save edit
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    setEditError("");
    editMutation.mutate(editForm);
  };

  const toggleMutation = useMutation({
    mutationFn: async (emp: Employee) => {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, isActive: !emp.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { data, emp };
    },
    onSuccess: ({ emp }) => {
      showSuccess(`${emp.name} ${emp.isActive ? "deactivated" : "activated"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeactivateTarget(null);
    },
    onError: (err: any) => setError(err.message)
  });

  // Toggle active / deactivate
  const handleToggleActive = (emp: Employee) => {
    toggleMutation.mutate(emp);
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelCls = "text-xs font-medium text-muted-foreground block mb-1";

  return (
    <div className="space-y-4">
      {/* Global alert */}
      {(error || success) && (
        <div className={cn("p-3 rounded-lg text-sm flex items-center justify-between",
          success
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        )}>
          {error || success}
          <button onClick={() => { setError(""); setSuccess(""); }}><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, ID…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Branches</option>
          {meta.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Departments</option>
          {meta.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Teams</option>
          {meta.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={designationFilter} onChange={(e) => { setDesignationFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Designations</option>
          {meta.designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['employees'] })} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw size={16} className={cn("text-muted-foreground", (loading || isFetching) && "animate-spin")} />
        </button>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{total} employees found</div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Employee", "Department", "Role", "Contact", "Joined", "Attendance", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                </td></tr>
              )}
              {!loading && employees.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No employees found</td></tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className={cn("hover:bg-muted/30 transition-colors", !emp.isActive && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", getAvatarColor(emp.name))}>
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <button type="button" onClick={() => setSelectedEmployee(emp)} className="font-medium hover:text-primary hover:underline text-left">{emp.name}</button>
                        <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department?.name ?? "—"}</td>
                  <td className="px-4 py-3"><RoleBadge role={emp.role} /></td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{emp.email}</p>
                    <p className="text-xs text-muted-foreground">{emp.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(emp.joinDate)}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{emp._count.attendance}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      emp.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", emp.isActive ? "bg-emerald-500" : "bg-red-500")} />
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* View Profile */}
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        title="View Profile"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Eye size={14} />
                      </Link>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(emp)}
                        title="Edit Employee"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => setDeactivateTarget(emp)}
                        title={emp.isActive ? "Deactivate Employee" : "Activate Employee"}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          emp.isActive
                            ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600"
                            : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600"
                        )}
                      >
                        {emp.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Employee Modal ────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">Add New Employee</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: "name", l: "Full Name*", type: "text", req: true },
                  { k: "email", l: "Email*", type: "email", req: true },
                  { k: "password", l: "Password*", type: "password", req: true },
                  { k: "phone", l: "Phone", type: "tel", req: false },
                  { k: "joinDate", l: "Join Date", type: "date", req: false },
                  { k: "shiftStart", l: "Shift Start", type: "time", req: false },
                  { k: "shiftEnd", l: "Shift End", type: "time", req: false },
                  { k: "fathersName", l: "Father's Name", type: "text", req: false },
                  { k: "dateOfBirth", l: "Date of Birth", type: "date", req: false },
                  { k: "linkedInUrl", l: "LinkedIn URL", type: "url", req: false },
                ].map(({ k, l, type, req }) => (
                  <div key={k}>
                    <label className={labelCls}>{l}</label>
                    <input type={type} required={req} value={(form as any)[k]}
                      onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                      className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inputCls}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Branch</label>
                  <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} className={inputCls}>
                    <option value="">Select Branch</option>
                    {meta.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <select value={form.departmentId} onChange={e => {
                    setForm(p => ({ ...p, departmentId: e.target.value, teamId: "", designationId: "" }));
                  }} className={inputCls}>
                    <option value="">Select Department</option>
                    {meta.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Team</label>
                  <select value={form.teamId} onChange={e => setForm(p => ({ ...p, teamId: e.target.value }))} className={inputCls}>
                    <option value="">Select Team</option>
                    {meta.teams.filter(t => t.departmentId === form.departmentId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <select value={form.designationId} onChange={e => setForm(p => ({ ...p, designationId: e.target.value }))} className={inputCls}>
                    <option value="">Select Designation</option>
                    {meta.designations.filter(d => d.departmentId === form.departmentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Reporting Manager</label>
                  <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))} className={inputCls}>
                    <option value="">Select Manager</option>
                    {meta.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <textarea value={form.address} rows={2}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Full residential address"
                    className="w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={addMutation.isPending} className="flex-1 justify-center">
                  {addMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : "Add Employee"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Employee Modal ───────────────────── */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-display font-bold text-lg">Edit Employee</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editEmployee.employeeId} · {editEmployee.email}</p>
              </div>
              <button onClick={() => setEditEmployee(null)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {editError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{editError}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: "name", l: "Full Name*", type: "text" },
                  { k: "phone", l: "Phone", type: "tel" },
                  { k: "shiftStart", l: "Shift Start", type: "time" },
                  { k: "shiftEnd", l: "Shift End", type: "time" },
                  { k: "fathersName", l: "Father's Name", type: "text" },
                  { k: "dateOfBirth", l: "Date of Birth", type: "date" },
                  { k: "linkedInUrl", l: "LinkedIn URL", type: "url" },
                ].map(({ k, l, type }) => (
                  <div key={k}>
                    <label className={labelCls}>{l}</label>
                    <input type={type} value={(editForm as any)[k] || ""}
                      onChange={e => setEditForm((p: any) => ({ ...p, [k]: e.target.value }))}
                      className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Role</label>
                  <select value={editForm.role || "EMPLOYEE"} onChange={e => setEditForm((p: any) => ({ ...p, role: e.target.value }))} className={inputCls}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Branch</label>
                  <select value={editForm.branchId || ""} onChange={e => setEditForm((p: any) => ({ ...p, branchId: e.target.value }))} className={inputCls}>
                    <option value="">Select Branch</option>
                    {meta.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <select value={editForm.departmentId || ""} onChange={e => {
                    setEditForm((p: any) => ({ ...p, departmentId: e.target.value, teamId: "", designationId: "" }));
                  }} className={inputCls}>
                    <option value="">Select Department</option>
                    {meta.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Team</label>
                  <select value={editForm.teamId || ""} onChange={e => setEditForm((p: any) => ({ ...p, teamId: e.target.value }))} className={inputCls}>
                    <option value="">Select Team</option>
                    {meta.teams.filter(t => t.departmentId === editForm.departmentId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <select value={editForm.designationId || ""} onChange={e => setEditForm((p: any) => ({ ...p, designationId: e.target.value }))} className={inputCls}>
                    <option value="">Select Designation</option>
                    {meta.designations.filter(d => d.departmentId === editForm.departmentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Reporting Manager</label>
                  <select value={editForm.managerId || ""} onChange={e => setEditForm((p: any) => ({ ...p, managerId: e.target.value }))} className={inputCls}>
                    <option value="">Select Manager</option>
                    {meta.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={editForm.gender || ""} onChange={e => setEditForm((p: any) => ({ ...p, gender: e.target.value }))} className={inputCls}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <textarea value={editForm.address || ""} rows={2}
                    onChange={e => setEditForm((p: any) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={editMutation.isPending} className="flex-1 justify-center">
                  {editMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                </Button>
                <Button variant="outline" type="button" onClick={() => setEditEmployee(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirmation Modal ─────────── */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center",
                deactivateTarget.isActive ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
              )}>
                {deactivateTarget.isActive
                  ? <UserX size={18} className="text-red-600" />
                  : <UserCheck size={18} className="text-emerald-600" />
                }
              </div>
              <div>
                <h3 className="font-bold">{deactivateTarget.isActive ? "Deactivate Employee?" : "Activate Employee?"}</h3>
                <p className="text-sm text-muted-foreground">{deactivateTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {deactivateTarget.isActive
                ? "This employee will lose access to the system immediately. You can re-activate them anytime."
                : "This employee will regain access to the system."
              }
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleToggleActive(deactivateTarget)}
                disabled={toggleMutation.isPending}
                className={cn("flex-1 justify-center", deactivateTarget.isActive ? "bg-red-600 hover:bg-red-700" : "")}
              >
                {toggleMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  : deactivateTarget.isActive ? "Yes, Deactivate" : "Yes, Activate"
                }
              </Button>
              <Button variant="outline" onClick={() => setDeactivateTarget(null)} className="flex-1 justify-center">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee Detail Modal ─────────────────── */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">Employee Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selectedEmployee)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => setSelectedEmployee(null)} className="p-1.5 hover:bg-muted rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold", getAvatarColor(selectedEmployee.name))}>
                  {getInitials(selectedEmployee.name)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedEmployee.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.employeeId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={selectedEmployee.role} />
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      selectedEmployee.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", selectedEmployee.isActive ? "bg-emerald-500" : "bg-red-500")} />
                      {selectedEmployee.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: "Email", v: selectedEmployee.email },
                    { l: "Phone", v: selectedEmployee.phone || "—" },
                    { l: "Father's Name", v: selectedEmployee.fathersName || "—" },
                    { l: "Date of Birth", v: selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : "—" },
                    { l: "Gender", v: selectedEmployee.gender || "—" },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-xs text-muted-foreground">{l}</p>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{selectedEmployee.address || "—"}</p>
                  </div>
                  {selectedEmployee.linkedInUrl && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">LinkedIn</p>
                      <a href={selectedEmployee.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">{selectedEmployee.linkedInUrl}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Info */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Work Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: "Branch", v: selectedEmployee.branch?.name || "—" },
                    { l: "Department", v: selectedEmployee.department?.name || "—" },
                    { l: "Team", v: selectedEmployee.team?.name || "—" },
                    { l: "Designation", v: selectedEmployee.designation?.name || "—" },
                    { l: "Reporting Manager", v: selectedEmployee.reportingManager?.name || "—" },
                    { l: "Join Date", v: formatDate(selectedEmployee.joinDate) },
                    { l: "Shift", v: `${selectedEmployee.shiftStart} – ${selectedEmployee.shiftEnd}` },
                    { l: "Total Attendance", v: `${selectedEmployee._count.attendance} days` },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-xs text-muted-foreground">{l}</p>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Limit Modal */}
      {limitModal.show && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-center">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserX size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Plan Limit Reached</h2>
              <p className="text-muted-foreground mb-6">
                You've reached the maximum number of employees allowed on your current plan.
              </p>
              
              <div className="bg-muted/50 rounded-xl p-4 mb-8 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
                  <Badge label={limitModal.planName} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Employees Used</span>
                  <span className="font-bold text-lg">{limitModal.used} / {limitModal.limit}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  onClick={() => window.location.href = "/admin/billing"}
                >
                  Upgrade Plan Now
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setLimitModal({ ...limitModal, show: false })}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
