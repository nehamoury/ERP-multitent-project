"use client";

import { useState } from "react";
import { FileText, Search, Filter, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";

// Mock data since we don't have a DB model for this yet
const mockTickets = [
  {
    id: "TKT-1029",
    vendorName: "Acme Corp",
    subject: "Cannot access Payroll module",
    status: "OPEN",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
  },
  {
    id: "TKT-1028",
    vendorName: "Globex Inc",
    subject: "Billing invoice request for May",
    status: "RESOLVED",
    priority: "LOW",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "TKT-1027",
    vendorName: "Stark Industries",
    subject: "How to add multiple branches?",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function SupportClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState(mockTickets);

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "IN_PROGRESS": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "RESOLVED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-500";
      case "MEDIUM": return "text-amber-500";
      case "LOW": return "text-emerald-500";
      default: return "text-gray-500";
    }
  };

  const resolveTicket = (id: string) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: "RESOLVED" } : t));
    alert(`Ticket ${id} marked as resolved`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Support Tickets
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and resolve issues reported by vendors
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-border/50 bg-muted/20">
          <h3 className="text-lg font-medium">Vendor Inquiries</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search tickets..."
                className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="md" className="shrink-0 border-border/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket ID</th>
                  <th className="px-6 py-4 font-medium">Vendor</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {ticket.vendorName}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {ticket.status !== "RESOLVED" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 flex items-center justify-center text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => resolveTicket(ticket.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
