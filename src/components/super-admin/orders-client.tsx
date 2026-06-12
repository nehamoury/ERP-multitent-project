"use client";

import { useState } from "react";
import { Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface OrdersClientProps {
  orders: any[];
}

export default function OrdersClient({ orders }: OrdersClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || o.email.toLowerCase().includes(searchTerm.toLowerCase()) || o.razorpayOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"><CheckCircle2 size={12} /> Paid</span>;
      case "FAILED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"><XCircle size={12} /> Failed</span>;
      case "EXPIRED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"><AlertCircle size={12} /> Expired</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-muted/20">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by company, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-input px-3 py-2 rounded-lg">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Company & Admin</th>
              <th className="px-6 py-4 font-medium">Plan & Amount</th>
              <th className="px-6 py-4 font-medium">Razorpay Order ID</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{order.vendorName}</div>
                    <div className="text-xs text-muted-foreground">{order.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{order.plan.name}</div>
                    <div className="text-xs text-muted-foreground">₹{order.amount}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {order.razorpayOrderId}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
