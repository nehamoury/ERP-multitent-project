"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Users, CreditCard, DollarSign, Activity, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function SuperAdminDashboardClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/super-admin/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    }
  });

  const metrics = data?.metrics || {
    totalVendors: 0, activeVendors: 0, trialVendors: 0, expiredVendors: 0,
    mrr: 0, arr: 0, totalEmployees: 0, activeUsers: 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Super Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your SaaS platform metrics and revenue.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vendor Metrics */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.totalVendors}</h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Building2 size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                  <h3 className="text-2xl font-bold text-emerald-500 mt-1">{metrics.activeVendors}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trial Vendors</p>
                  <h3 className="text-2xl font-bold text-amber-500 mt-1">{metrics.trialVendors}</h3>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Clock size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expired Vendors</p>
                  <h3 className="text-2xl font-bold text-red-500 mt-1">{metrics.expiredVendors}</h3>
                </div>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><AlertCircle size={20} /></div>
              </div>
            </div>

            {/* Revenue & User Metrics */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MRR</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(metrics.mrr)}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ARR</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(metrics.arr)}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.totalEmployees}</h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.activeUsers}</h3>
                </div>
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Activity size={20} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Vendors List */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                Recent Onboardings
              </h3>
              <div className="space-y-4">
                {data?.recentVendors?.map((vendor: any) => (
                  <div key={vendor.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(vendor.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        {vendor.plan}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{vendor.status}</p>
                    </div>
                  </div>
                ))}
                {data?.recentVendors?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent vendors.</p>
                )}
              </div>
            </div>

            {/* Placeholder for Revenue Chart */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Subscription Revenue
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10 p-6 text-center">
                <DollarSign size={32} className="mb-2 opacity-50" />
                <p className="font-medium">Revenue Chart</p>
                <p className="text-xs mt-1 max-w-[200px]">Detailed monthly revenue charts will be visible as transactions occur.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
