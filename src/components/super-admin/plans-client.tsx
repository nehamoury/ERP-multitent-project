"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, Edit, CheckCircle2, Users, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FEATURES = [
  "Attendance Tracking",
  "Leave Management",
  "Payroll",
  "Projects",
  "Basic Reports",
  "Advanced Reports",
  "API Access",
  "Dedicated Support"
];

export default function PlansClient() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const res = await fetch('/api/super-admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/super-admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save plan');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] });
      setEditingPlan(null);
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) saveMutation.mutate(editingPlan);
  };

  const toggleFeature = (feature: string) => {
    if (!editingPlan) return;
    const features = editingPlan.features || [];
    if (features.includes(feature)) {
      setEditingPlan({ ...editingPlan, features: features.filter((f: string) => f !== feature) });
    } else {
      setEditingPlan({ ...editingPlan, features: [...features, feature] });
    }
  };

  const plans = response?.plans || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pricing tiers and feature access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl h-96 animate-pulse" />
          ))
        ) : (
          ["FREE", "STARTER", "PRO", "ENTERPRISE"].map((planName) => {
            const plan = plans.find((p: any) => p.name === planName);
            
            if (editingPlan?.name === planName) {
              return (
                <form key={planName} onSubmit={handleSave} className="bg-card border-2 border-primary rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <h3 className="font-bold text-xl text-primary">{planName}</h3>
                      <button type="button" onClick={() => setEditingPlan(null)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={editingPlan.priceMonthly} 
                        onChange={e => setEditingPlan({...editingPlan, priceMonthly: e.target.value})}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Yearly Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={editingPlan.priceYearly} 
                        onChange={e => setEditingPlan({...editingPlan, priceYearly: e.target.value})}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Max Employees</label>
                      <input 
                        type="number" 
                        required 
                        value={editingPlan.maxEmployees} 
                        onChange={e => setEditingPlan({...editingPlan, maxEmployees: e.target.value})}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Features</label>
                      <div className="h-40 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                        {DEFAULT_FEATURES.map(f => (
                          <label key={f} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
                            <input 
                              type="checkbox" 
                              checked={(editingPlan.features || []).includes(f)}
                              onChange={() => toggleFeature(f)}
                              className="rounded border-border bg-muted text-primary focus:ring-primary"
                            />
                            {f}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={saveMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {saveMutation.isPending ? "Saving..." : <><Save size={16} /> Save Plan</>}
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div key={planName} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col relative group">
                <button 
                  onClick={() => setEditingPlan(plan || { name: planName, priceMonthly: 0, priceYearly: 0, maxEmployees: 10, features: [] })}
                  className="absolute top-4 right-4 p-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all text-muted-foreground"
                >
                  <Edit size={16} />
                </button>

                <div className="mb-6">
                  <h3 className="font-bold text-xl text-foreground mb-2">{planName}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">₹{plan?.priceMonthly || 0}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">₹{plan?.priceYearly || 0} billed yearly</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-6">
                  <div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg"><Users size={16} /></div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Up to {plan?.maxEmployees || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Employees</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features</p>
                  {plan ? (
                    (plan.features as string[])?.map((f: string) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Plan not configured</p>
                  )}
                </div>

                {plan && (
                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Active Subs:</span>
                    <span className="font-bold text-foreground bg-muted px-2 py-1 rounded-lg">{plan._count?.subscriptions || 0}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
