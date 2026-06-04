"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, Phone, Calendar, CheckCircle2, User, Users, MapPin, Briefcase, FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VendorDetailsClient({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-vendor', vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/vendors/${vendorId}`);
      if (!res.ok) throw new Error('Failed to fetch vendor details');
      return res.json();
    }
  });

  const vendor = data?.vendor;

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Loading vendor details...</div>;
  }

  if (!vendor) {
    return <div className="p-6 text-center text-red-500">Vendor not found</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/vendors" className="text-muted-foreground hover:text-foreground">
          &larr; Back to Vendors
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-bold">
            {vendor.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display">{vendor.name}</h1>
            <p className="text-muted-foreground">/{vendor.slug} • Joined {format(new Date(vendor.createdAt), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={cn(
            "px-4 py-1.5 font-bold uppercase rounded-xl text-sm",
            vendor.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
            vendor.status === "SUSPENDED" ? "bg-red-500/10 text-red-500" :
            "bg-amber-500/10 text-amber-500"
          )}>
            {vendor.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-primary" />
            Company Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
              <p className="font-medium text-foreground">{vendor.email}</p>
            </div>
            {vendor.phone && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                <p className="font-medium text-foreground">{vendor.phone}</p>
              </div>
            )}
            {vendor.gstin && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">GSTIN</p>
                <p className="font-medium text-foreground">{vendor.gstin}</p>
              </div>
            )}
            {vendor.billingAddress && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Address</p>
                <p className="font-medium text-foreground">{vendor.billingAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <CreditCard size={18} className="text-primary" />
            Subscription Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Current Plan</p>
              <p className="font-bold text-lg text-primary">{vendor.subscription?.plan?.name || "NONE"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
              <p className="font-medium text-foreground">{vendor.subscription?.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Period</p>
              <p className="font-medium text-foreground">
                {vendor.subscription?.currentPeriodStart ? format(new Date(vendor.subscription.currentPeriodStart), "MMM d, yyyy") : "-"} 
                {" to "}
                {vendor.subscription?.currentPeriodEnd ? format(new Date(vendor.subscription.currentPeriodEnd), "MMM d, yyyy") : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Monthly Amount</p>
              <p className="font-medium text-foreground">
                ₹{vendor.subscription?.plan?.priceMonthly || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Usage & Admin Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <User size={18} className="text-primary" />
            Admin & Usage
          </h3>
          <div className="space-y-4">
            {vendor.users[0] ? (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Primary Admin</p>
                <p className="font-bold text-foreground">{vendor.users[0].name}</p>
                <p className="text-sm text-muted-foreground">{vendor.users[0].email}</p>
              </div>
            ) : (
              <p className="text-sm text-red-500">No Admin User Found</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-xl">
                <Users size={16} className="text-blue-500 mb-1" />
                <span className="text-lg font-bold">{vendor._count.users}</span>
                <span className="text-[10px] uppercase text-muted-foreground">Employees</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-xl">
                <MapPin size={16} className="text-emerald-500 mb-1" />
                <span className="text-lg font-bold">{vendor._count.branches}</span>
                <span className="text-[10px] uppercase text-muted-foreground">Branches</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-xl">
                <Building2 size={16} className="text-purple-500 mb-1" />
                <span className="text-lg font-bold">{vendor._count.departments}</span>
                <span className="text-[10px] uppercase text-muted-foreground">Departments</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-xl">
                <Briefcase size={16} className="text-amber-500 mb-1" />
                <span className="text-lg font-bold">{vendor._count.projects}</span>
                <span className="text-[10px] uppercase text-muted-foreground">Projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
