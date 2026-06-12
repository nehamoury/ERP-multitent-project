"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Plus, Building2, Mail, Phone, Calendar, MoreVertical, Edit, Ban,
  CheckCircle2, Copy, Eye, PlaySquare, LogIn, Trash2, AlertTriangle,
  Info, Clock, ShieldAlert, X, Save, RefreshCw
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  gstin?: string | null;
  state?: string | null;
  billingAddress?: string | null;
  users: { id: string; name: string; email: string }[];
  subscription: {
    id: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string;
    plan: { name: string; maxEmployees: number };
  } | null;
}

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "PENDING" | "TRIAL" | "EXPIRED";

export default function VendorsClient() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{ email: string; pass: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { update } = useSession();

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Add Form State ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", slug: "", email: "", phone: "",
    adminName: "", planName: "FREE", gstin: "", state: "", billingAddress: "",
  });

  // ── Edit Form State ─────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    name: "", slug: "", email: "", phone: "",
    status: "ACTIVE", planName: "FREE", gstin: "", state: "", billingAddress: "",
  });

  // ── Data Query ──────────────────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: ['super-admin-vendors'],
    queryFn: async () => {
      const res = await fetch('/api/super-admin/vendors');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    }
  });

  const vendors: Vendor[] = response?.vendors || [];

  // ── Filtered Vendors ────────────────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    if (statusFilter === "ALL") return vendors;
    if (statusFilter === "TRIAL") {
      return vendors.filter(v => v.subscription?.status === "TRIAL");
    }
    if (statusFilter === "EXPIRED") {
      return vendors.filter(v => v.subscription?.status === "EXPIRED");
    }
    return vendors.filter(v => v.status === statusFilter);
  }, [vendors, statusFilter]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === "ACTIVE").length,
    trial: vendors.filter(v => v.subscription?.status === "TRIAL").length,
    suspended: vendors.filter(v => v.status === "SUSPENDED").length,
  };

  // ── Add Mutation ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/super-admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create vendor');
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-vendors'] });
      setIsAddModalOpen(false);
      setFormData({ name: "", slug: "", email: "", phone: "", adminName: "", planName: "FREE", gstin: "", state: "", billingAddress: "" });
      setCredentialsModal({ email: data.adminEmail, pass: data.adminPassword });
      showToast("Vendor created successfully!", "success");
    },
    onError: (err: any) => showToast(err.message, "error"),
  });

  // ── Edit Mutation ───────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async (data: typeof editForm & { id: string }) => {
      const res = await fetch('/api/super-admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update vendor');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-vendors'] });
      setEditingVendor(null);
      showToast("Vendor updated successfully!", "success");
    },
    onError: (err: any) => showToast(err.message, "error"),
  });

  // ── Status/Suspend Toggle Mutation ──────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async ({ vendor, newStatus }: { vendor: Vendor; newStatus: string }) => {
      const res = await fetch('/api/super-admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          email: vendor.email,
          phone: vendor.phone,
          status: newStatus,
          planName: vendor.subscription?.plan?.name || "FREE",
          gstin: vendor.gstin,
          state: vendor.state,
          billingAddress: vendor.billingAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update status');
      return json;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-vendors'] });
      showToast(`Vendor ${newStatus === "SUSPENDED" ? "suspended" : "activated"} successfully!`, "success");
    },
    onError: (err: any) => showToast(err.message, "error"),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditForm({
      name: vendor.name,
      slug: vendor.slug,
      email: vendor.email,
      phone: vendor.phone || "",
      status: vendor.status,
      planName: vendor.subscription?.plan?.name || "FREE",
      gstin: vendor.gstin || "",
      state: vendor.state || "",
      billingAddress: vendor.billingAddress || "",
    });
    setActiveDropdown(null);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    editMutation.mutate({ ...editForm, id: editingVendor.id });
  };

  const copyCredentials = () => {
    if (credentialsModal) {
      navigator.clipboard.writeText(`Email: ${credentialsModal.email}\nPassword: ${credentialsModal.pass}`);
      showToast("Credentials copied to clipboard!", "success");
    }
  };

  // ── Trial Helper ────────────────────────────────────────────────────────────
  const getTrialInfo = (vendor: Vendor) => {
    if (!vendor.subscription?.trialEndsAt) return null;
    const trialEnd = new Date(vendor.subscription.trialEndsAt);
    const daysLeft = differenceInDays(trialEnd, new Date());
    const expired = isPast(trialEnd);
    return { trialEnd, daysLeft, expired };
  };

  // ── Filter Tabs ─────────────────────────────────────────────────────────────
  const filterTabs: { label: string; value: StatusFilter; count: number; color: string }[] = [
    { label: "All", value: "ALL", count: stats.total, color: "bg-primary/10 text-primary border-primary/30" },
    { label: "Active", value: "ACTIVE", count: stats.active, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    { label: "On Trial", value: "TRIAL", count: stats.trial, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
    { label: "Suspended", value: "SUSPENDED", count: stats.suspended, color: "bg-red-500/10 text-red-600 border-red-500/30" },
    { label: "Pending", value: "PENDING", count: vendors.filter(v => v.status === "PENDING").length, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    { label: "Expired", value: "EXPIRED", count: vendors.filter(v => v.subscription?.status === "EXPIRED").length, color: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
  ];

  const inputCls = "w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground";
  const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors &amp; Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all SaaS companies and their subscriptions.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus size={18} />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Vendors", value: stats.total, icon: Building2, color: "blue" },
          { label: "Active Vendors", value: stats.active, icon: CheckCircle2, color: "emerald" },
          { label: "On Trial", value: stats.trial, icon: PlaySquare, color: "purple" },
          { label: "Suspended", value: stats.suspended, icon: Ban, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${color}-500/10 text-${color}-500`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <h3 className="text-xl font-bold text-foreground">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
              statusFilter === tab.value
                ? tab.color + " shadow-sm"
                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-bold",
              statusFilter === tab.value ? "bg-white/30" : "bg-muted"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Plan &amp; Trial</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />Loading vendors...
                </td></tr>
              ) : filteredVendors.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  No vendors found for "{statusFilter}" filter.
                </td></tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const trial = getTrialInfo(vendor);
                  return (
                    <tr key={vendor.id} className="hover:bg-muted/30 transition-colors">
                      {/* Company */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">/{vendor.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Admin */}
                      <td className="px-6 py-4">
                        {vendor.users[0] ? (
                          <div>
                            <p className="font-medium text-foreground text-xs">{vendor.users[0].name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Admin</span>
                        )}
                      </td>
                      {/* Plan & Trial */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-max px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/10 text-blue-600">
                            {vendor.subscription?.plan?.name || "NONE"}
                          </span>
                          {vendor.subscription?.status === "TRIAL" && trial && !trial.expired && (
                            <span className={cn(
                              "text-[10px] font-semibold",
                              trial.daysLeft <= 3 ? "text-red-500" : "text-amber-500"
                            )}>
                              ⏱ {trial.daysLeft}d left
                            </span>
                          )}
                          {vendor.subscription?.status === "TRIAL" && trial?.expired && (
                            <span className="text-[10px] font-semibold text-red-500">Trial Expired</span>
                          )}
                          {vendor.subscription?.status === "EXPIRED" && (
                            <span className="text-[10px] font-semibold text-slate-500">Expired</span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex w-max px-2 py-0.5 text-[10px] font-bold uppercase rounded-full",
                            vendor.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" :
                            vendor.status === "SUSPENDED" ? "bg-red-500/10 text-red-600" :
                            "bg-amber-500/10 text-amber-600"
                          )}>
                            {vendor.status}
                          </span>
                          {vendor.subscription?.status && vendor.subscription.status !== "ACTIVE" && (
                            <span className={cn(
                              "text-[10px] font-semibold",
                              vendor.subscription.status === "TRIAL" ? "text-purple-500" :
                              vendor.subscription.status === "EXPIRED" ? "text-slate-500" :
                              "text-muted-foreground"
                            )}>
                              {vendor.subscription.status}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === vendor.id ? null : vendor.id)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeDropdown === vendor.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                            <div className="absolute right-6 top-10 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                              <button
                                onClick={() => { setViewingVendor(vendor); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted text-foreground transition-colors"
                              >
                                <Eye size={14} /> View Details
                              </button>
                              <button
                                onClick={() => openEditModal(vendor)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted text-foreground transition-colors"
                              >
                                <Edit size={14} /> Edit Vendor
                              </button>
                              <button
                                onClick={() => {
                                  const newStatus = vendor.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
                                  statusMutation.mutate({ vendor, newStatus });
                                  setActiveDropdown(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted text-amber-500 transition-colors"
                              >
                                <Ban size={14} /> {vendor.status === "SUSPENDED" ? "Activate" : "Suspend"}
                              </button>
                              {vendor.users[0] && (
                                <button
                                  onClick={async () => {
                                    await update({ impersonateVendorId: vendor.id });
                                    window.location.href = '/admin';
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted text-emerald-500 transition-colors"
                                >
                                  <LogIn size={14} /> Login As Vendor
                                </button>
                              )}
                              <div className="h-px bg-border my-1" />
                              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 transition-colors">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredVendors.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADD VENDOR MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Plus size={18} className="text-primary" />Add New Client</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col max-h-[85vh]">
              <div className="p-6 space-y-5 overflow-y-auto">
              {/* Company Details */}
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Company Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Company Name *</label>
                    <input required value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                        setFormData({ ...formData, name, slug });
                      }}
                      className={inputCls} placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className={labelCls}>Company Slug *</label>
                    <input required value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className={inputCls} placeholder="acme-corp" />
                  </div>
                </div>
              </div>
              {/* Subscription */}
              <div className="border-t border-border/50 pt-4">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Subscription &amp; Tax</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Initial Plan</label>
                    <select value={formData.planName} onChange={(e) => setFormData({ ...formData, planName: e.target.value })} className={inputCls}>
                      <option value="FREE">Free Trial (14 days)</option>
                      <option value="STARTER">Starter</option>
                      <option value="PRO">Pro</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>GSTIN / Tax ID</label>
                    <input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} className={inputCls} placeholder="27AAAAA1111A1Z1" />
                  </div>
                  <div>
                    <label className={labelCls}>State / Region</label>
                    <input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={inputCls} placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Billing Address</label>
                  <textarea value={formData.billingAddress} onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })} className={inputCls + " min-h-[60px] resize-y"} placeholder="123 Corporate Office, Business Park" />
                </div>
              </div>
              {/* Admin Account */}
              <div className="border-t border-border/50 pt-4">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Primary Admin Account</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Admin Full Name *</label>
                    <input required value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} className={inputCls} placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Admin Email *</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="admin@acmecorp.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="+91 9876543210" />
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-3 border-t border-border bg-muted/30">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={addMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
                  {addMutation.isPending ? <><RefreshCw size={14} className="animate-spin" /> Creating...</> : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EDIT VENDOR MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit size={18} className="text-primary" /> Edit: {editingVendor.name}
              </h2>
              <button onClick={() => setEditingVendor(null)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col max-h-[85vh]">
              <div className="p-6 space-y-5 overflow-y-auto">
              {/* Company Details */}
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Company Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Company Name *</label>
                    <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Slug *</label>
                    <input required value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>
              {/* Status & Plan */}
              <div className="border-t border-border/50 pt-4">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Status &amp; Subscription</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Vendor Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inputCls}>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Subscription Plan</label>
                    <select value={editForm.planName} onChange={(e) => setEditForm({ ...editForm, planName: e.target.value })} className={inputCls}>
                      <option value="FREE">Free Trial</option>
                      <option value="STARTER">Starter</option>
                      <option value="PRO">Pro</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Tax & Billing */}
              <div className="border-t border-border/50 pt-4">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Tax &amp; Billing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>GSTIN / Tax ID</label>
                    <input value={editForm.gstin} onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })} className={inputCls} placeholder="27AAAAA1111A1Z1" />
                  </div>
                  <div>
                    <label className={labelCls}>State / Region</label>
                    <input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className={inputCls} placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Billing Address</label>
                  <textarea value={editForm.billingAddress} onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })} className={inputCls + " min-h-[60px] resize-y"} />
                </div>
              </div>

              </div>
              <div className="px-6 py-4 flex justify-end gap-3 border-t border-border bg-muted/30">
                <button type="button" onClick={() => setEditingVendor(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={editMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
                  {editMutation.isPending ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CREDENTIALS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {credentialsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden text-center p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Vendor Created!</h2>
            <p className="text-sm text-muted-foreground mb-6">Share these credentials securely. The password cannot be viewed again.</p>
            <div className="bg-muted rounded-xl p-4 text-left space-y-3 mb-6 border border-border">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Admin Email</span>
                <p className="font-medium text-foreground">{credentialsModal.email}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Generated Password</span>
                <p className="font-mono text-lg font-bold text-primary tracking-widest">{credentialsModal.pass}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCredentialsModal(null)} className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl text-sm font-medium transition-colors">Close</button>
              <button onClick={copyCredentials} className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Copy size={16} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW DETAILS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewingVendor && (() => {
        const trial = getTrialInfo(viewingVendor);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">{viewingVendor.name}</h2>
                </div>
                <button onClick={() => setViewingVendor(null)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Trial Warning Banner */}
                {viewingVendor.subscription?.status === "TRIAL" && trial && (
                  <div className={cn(
                    "rounded-xl p-4 border flex items-start gap-3",
                    trial.expired
                      ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                      : trial.daysLeft <= 3
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
                  )}>
                    {trial.expired ? <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" /> :
                      trial.daysLeft <= 3 ? <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" /> :
                        <Clock size={18} className="flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold text-sm">
                        {trial.expired ? "Free Trial Has Expired" :
                          trial.daysLeft <= 3 ? `Trial Expiring Soon — ${trial.daysLeft} day${trial.daysLeft !== 1 ? "s" : ""} left!` :
                            `Free Trial Active — ${trial.daysLeft} days remaining`}
                      </p>
                      <p className="text-xs mt-0.5 opacity-80">
                        {trial.expired
                          ? "This vendor has been auto-suspended. They must upgrade to restore access."
                          : `Trial ends on ${format(trial.trialEnd, "dd MMM yyyy")}. After expiry, the vendor will be auto-suspended.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Banner */}
                <div className="grid grid-cols-3 gap-3 bg-muted/20 border border-border/50 rounded-xl p-4">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Vendor Status</div>
                    <span className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      viewingVendor.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      viewingVendor.status === "SUSPENDED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                      "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      {viewingVendor.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Plan</div>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      {viewingVendor.subscription?.plan?.name || "No Plan"}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Subscription</div>
                    <span className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      viewingVendor.subscription?.status === "TRIAL" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                      viewingVendor.subscription?.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      viewingVendor.subscription?.status === "EXPIRED" ? "bg-slate-500/10 text-slate-600 border-slate-500/20" :
                      "bg-muted text-muted-foreground border-border"
                    )}>
                      {viewingVendor.subscription?.status || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Two Column Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Company Profile</h3>
                    {[
                      { label: "Slug", value: `/${viewingVendor.slug}` },
                      { label: "Email", value: viewingVendor.email },
                      { label: "Phone", value: viewingVendor.phone || "Not provided" },
                      { label: "Joined", value: format(new Date(viewingVendor.createdAt), "dd MMM yyyy") },
                      { label: "Max Employees", value: `${viewingVendor.subscription?.plan?.maxEmployees || 0} Employees` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{label}</span>
                        <p className="font-medium text-foreground text-sm">{value}</p>
                      </div>
                    ))}
                    {trial && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Trial Ends</span>
                        <p className="font-medium text-foreground text-sm">{format(trial.trialEnd, "dd MMM yyyy")}</p>
                      </div>
                    )}
                  </div>
                  {/* Billing */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Billing &amp; Tax</h3>
                    {[
                      { label: "GSTIN / Tax ID", value: viewingVendor.gstin || "Not provided" },
                      { label: "State / Region", value: viewingVendor.state || "Not provided" },
                      { label: "Billing Address", value: viewingVendor.billingAddress || "Not provided" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{label}</span>
                        <p className="font-medium text-foreground text-sm whitespace-pre-wrap">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin */}
                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Primary Admin Account</h3>
                  {viewingVendor.users[0] ? (
                    <div className="flex items-center gap-3 bg-muted/20 border border-border/40 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {viewingVendor.users[0].name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{viewingVendor.users[0].name}</p>
                        <p className="text-xs text-muted-foreground">{viewingVendor.users[0].email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No administrator configured.</p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/20">
                <button
                  onClick={() => { setViewingVendor(null); openEditModal(viewingVendor); }}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Edit size={14} /> Edit this Vendor
                </button>
                <button
                  onClick={() => setViewingVendor(null)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TOAST */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            {toast.type === "success" && <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0"><CheckCircle2 size={18} /></div>}
            {toast.type === "error" && <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0"><AlertTriangle size={18} /></div>}
            {toast.type === "info" && <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0"><Info size={18} /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Info"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
