"use client";

import { CreditCard, CheckCircle2, Clock, Calendar, FileText, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function BillingClient({ vendor }: { vendor: any }) {
  const subscription = vendor.subscription;
  const plan = subscription?.plan;
  const invoices = vendor.invoices || [];

  const isActive = subscription?.status === "ACTIVE";
  const daysLeft = subscription?.currentPeriodEnd 
    ? differenceInDays(new Date(subscription.currentPeriodEnd), new Date()) 
    : 0;

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Subscription Card */}
      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold flex items-center gap-2">
            <CreditCard size={18} className="text-blue-500" /> Current Plan
          </h2>
          {isActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold tracking-wider">
              <CheckCircle2 size={14} /> ACTIVE
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold tracking-wider">
              <Clock size={14} /> EXPIRED
            </div>
          )}
        </div>
        <div className="p-6">
          {subscription && plan ? (
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground mb-1">{plan.name} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Up to {plan.maxEmployees} employees and {plan.maxBranches} branches.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-muted px-4 py-2 rounded-xl text-sm border border-border flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    Valid until: <span className="font-semibold text-foreground">{format(new Date(subscription.currentPeriodEnd), "dd MMM yyyy")}</span>
                  </div>
                  {isActive && daysLeft <= 15 && (
                    <span className="text-sm font-semibold text-amber-500">
                      (Expires in {daysLeft} days)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-5 min-w-[200px] text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pricing</p>
                <p className="text-3xl font-black text-foreground">
                  ₹{plan.priceMonthly}<span className="text-base font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-2">or ₹{plan.priceYearly}/year</p>
                {plan.name !== "ENTERPRISE" && (
                  <button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active subscription found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Payment History */}
      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText size={18} className="text-emerald-500" /> Payment & Invoices
          </h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Invoice Date</th>
                <th className="px-6 py-4 font-bold">Invoice #</th>
                <th className="px-6 py-4 font-bold">Plan</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No payment history available.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice: any) => {
                  const payment = invoice.payments[0]; // Assuming 1 payment per invoice for manual flow
                  return (
                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {invoice.planName}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        ₹{invoice.totalAmount}
                      </td>
                      <td className="px-6 py-4">
                        {payment ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{payment.paymentMethod}</span>
                            {payment.referenceNo && (
                              <span className="text-[10px] text-muted-foreground uppercase">Ref: {payment.referenceNo}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-500">
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
