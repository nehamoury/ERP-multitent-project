"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge } from "@/components/ui/shared";
import { Users2, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

type Lead = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  adminName: string;
  vendorStatus: string;
  subscriptionStatus: string;
  planName: string;
  trialStart: string;
  trialEnd: string;
  createdAt: string;
};

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/leads?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/super-admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchLeads();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Lead Management" 
        description="Monitor trial signups, active companies, and expired trials."
        icon={Users2}
      />

      <div className="flex gap-2">
        {["ALL", "TRIAL", "PAID", "EXPIRED", "SUSPENDED"].map(f => (
          <Button 
            key={f} 
            variant={filter === f ? "primary" : "outline"} 
            size="sm" 
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trial Ends</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No leads found.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{lead.companyName}</td>
                <td className="px-4 py-3">{lead.adminName}</td>
                <td className="px-4 py-3">
                  <div>{lead.email}</div>
                  <div className="text-xs text-muted-foreground">{lead.phone}</div>
                </td>
                <td className="px-4 py-3 space-y-1">
                  <div><Badge label={lead.subscriptionStatus} /></div>
                  <div>
                    {lead.vendorStatus === "SUSPENDED" && <span className="text-xs text-destructive flex items-center gap-1"><ShieldAlert size={12}/> Suspended</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {lead.trialEnd ? new Date(lead.trialEnd).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {lead.vendorStatus === "ACTIVE" ? (
                    <Button variant="danger" size="sm" onClick={() => handleAction(lead.id, "SUSPEND")}>Suspend</Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleAction(lead.id, "ACTIVATE")}>Activate</Button>
                  )}
                  {lead.subscriptionStatus === "TRIAL" && (
                    <Button variant="primary" size="sm" onClick={() => handleAction(lead.id, "CONVERT_TO_PAID")}>Mark Paid</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
