"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RevenueClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-revenue'],
    queryFn: async () => {
      const res = await fetch('/api/super-admin/revenue');
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      return res.json();
    }
  });

  const metrics = data?.metrics || {
    todayRevenue: 0, thisMonthRevenue: 0, pendingPayments: 0, failedPayments: 0, mrr: 0, arr: 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial overview and subscription metrics.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">This Month Revenue</p>
                  <h3 className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(metrics.thisMonthRevenue)}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={20} /></div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Today's Revenue</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(metrics.todayRevenue)}</h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><DollarSign size={20} /></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Pending Payments</p>
                  <h3 className="text-2xl font-bold text-amber-500 mt-1">{formatCurrency(metrics.pendingPayments)}</h3>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Clock size={20} /></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Failed Payments</p>
                  <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(metrics.failedPayments)}</h3>
                </div>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><AlertCircle size={20} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-6">Revenue Trend (YTD)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.charts?.revenueTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customers Growth Chart */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-6">Customer Growth & Churn</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.customerTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff20', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="new" name="New Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper icons
function Clock(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function AlertCircle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
