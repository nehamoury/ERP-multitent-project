"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/shared";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from "recharts";

export default function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/super-admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Platform Analytics
        </h2>
        <p className="text-muted-foreground mt-1">
          Detailed metrics and growth trends across all vendors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Month-over-Month Growth</h3>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-emerald-500">{data.metrics.growthRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              New vendors acquired
            </p>
          </div>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Platform Churn Rate</h3>
            <Users className="h-4 w-4 text-red-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-500">{data.metrics.churnRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vendors cancelling subscriptions
            </p>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium">Active Ratio</h3>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-blue-500">{data.metrics.activeRatio}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active vs total registered vendors
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="Vendor Growth" description="Total vs Active vendors over the last 6 months" />
          <div className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="total" name="Total Vendors" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Active Vendors" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="Revenue Trend" description="Estimated MRR growth over time" />
          <div className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
