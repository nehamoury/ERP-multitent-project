"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Zap, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/shared";
import { useSession } from "next-auth/react";
import { PaymentHistory } from "./payment-history";
import { BillingSettings } from "./billing-settings";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmployees: number;
  features: string[];
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: Plan;
}

interface Usage {
  employees: number;
  maxEmployees: number;
}

export default function BillingClient() {
  const { data: session, update } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>({ employees: 0, maxEmployees: 5 });
  const [invoices, setInvoices] = useState([]);
  const [vendorSettings, setVendorSettings] = useState({ billingAddress: "", state: "", gstin: "" });
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      const [billingRes, invoicesRes] = await Promise.all([
        fetch("/api/billing"),
        fetch("/api/billing/invoices")
      ]);
      const billingData = await billingRes.json();
      const invoicesData = await invoicesRes.json();
      
      setPlans(billingData.plans || []);
      setSubscription(billingData.subscription || null);
      setUsage(billingData.usage || { employees: 0, maxEmployees: 5 });
      
      setInvoices(invoicesData.invoices || []);
      setVendorSettings(invoicesData.vendorSettings || { billingAddress: "", state: "", gstin: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add Razorpay Script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    fetchBilling();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/billing/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, isYearly }),
      });
      
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        toast.error(orderData.error || "Failed to create order");
        setUpgrading(null);
        return;
      }

      if (orderData.keyId === "rzp_test_mockkey") {
        // Development bypass: Simulate payment success directly
        toast.success("Development Mode: Simulating successful payment...");
        
        const plan = plans.find(p => p.id === planId);
        const baseAmount = isYearly ? plan?.priceYearly : plan?.priceMonthly;
        const gstAmount = Math.round((baseAmount || 0) * 0.18);
        
        const verifyRes = await fetch("/api/billing/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: "pay_mock_" + Date.now(),
            razorpay_order_id: orderData.orderId,
            razorpay_signature: "mock_signature_bypass",
            notes: {
              vendorId: session?.user?.vendorId,
              planId,
              planName: plan?.name,
              isYearly: isYearly ? "true" : "false",
              baseAmount: baseAmount?.toString(),
              gstAmount: gstAmount.toString()
            }
          }),
        });

        if (verifyRes.ok) {
          toast.success("Mock Subscription upgraded successfully!");
          fetchBilling();
          update(); 
        } else {
          toast.error("Mock Verification failed");
        }
        setUpgrading(null);
        return;
      }

      // 2. Open Razorpay Checkout (Actual)
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AttendIQ",
        description: "Subscription Upgrade",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          toast.loading("Verifying payment...", { id: "verify" });
          
          const plan = plans.find(p => p.id === planId);
          const baseAmount = isYearly ? plan?.priceYearly : plan?.priceMonthly;
          const gstAmount = Math.round((baseAmount || 0) * 0.18);
          
          // 3. Verify Payment
          const verifyRes = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              notes: {
                vendorId: session?.user?.vendorId,
                planId,
                planName: plan?.name,
                isYearly: isYearly ? "true" : "false",
                baseAmount: baseAmount?.toString(),
                gstAmount: gstAmount.toString()
              }
            }),
          });
          
          if (verifyRes.ok) {
            toast.success("Subscription upgraded successfully!", { id: "verify" });
            fetchBilling();
            update(); // refresh next-auth session
          } else {
            toast.error("Payment verification failed", { id: "verify" });
          }
          setUpgrading(null);
        },
        prefill: {
          name: orderData.vendorDetails.name,
          email: orderData.vendorDetails.email,
          contact: orderData.vendorDetails.phone,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function() {
            setUpgrading(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error.description);
        setUpgrading(null);
      });
      rzp.open();
    } catch (e) {
      toast.error("Something went wrong");
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((usage.employees / usage.maxEmployees) * 100));

  return (
    <div className="space-y-8">
      {/* Current Usage Banner */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <span className="bg-primary/10 text-primary p-1.5 rounded-lg">
                <Zap size={18} />
              </span>
              Current Plan: {subscription?.plan?.name || "FREE"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Your subscription is <span className="font-semibold text-emerald-600 dark:text-emerald-400">{subscription?.status || "ACTIVE"}</span>. 
              Renews on {subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "N/A"}.
            </p>
          </div>
          
          <div className="w-full md:w-72 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Employee Usage</span>
              <span className="text-muted-foreground">{usage.employees} / {usage.maxEmployees} limits</span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", 
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 75 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {usagePercent >= 90 && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> You are reaching your plan limits.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center space-y-2">
          <h2 className="font-display font-bold text-2xl md:text-3xl">Upgrade your workspace</h2>
          <p className="text-muted-foreground">Select a plan that fits your company's needs. GST at 18% applies.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted p-1 rounded-xl">
          <button 
            onClick={() => setIsYearly(false)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", !isYearly ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", isYearly ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Annually <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan?.name === plan.name;
          const price = isYearly ? plan.priceYearly : plan.priceMonthly;
          
          return (
            <div 
              key={plan.id} 
              className={cn(
                "relative bg-card rounded-2xl border p-6 flex flex-col transition-all duration-200 hover:shadow-lg hover:border-primary/50",
                isCurrent ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"
              )}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{price.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">/{isYearly ? "yr" : "mo"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Up to {plan.maxEmployees} employees.</p>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features included:</p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                variant={isCurrent ? "outline" : "primary"} 
                className="w-full justify-center"
                disabled={isCurrent || upgrading === plan.id || price === 0}
                onClick={() => handleUpgrade(plan.id)}
              >
                {upgrading === plan.id ? (
                  <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                ) : isCurrent ? (
                  "Active Plan"
                ) : price === 0 ? (
                  "Free Tier"
                ) : (
                  <>Upgrade to {plan.name}</>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Settings and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <BillingSettings initialSettings={vendorSettings} />
        </div>
        <div className="lg:col-span-2">
          <PaymentHistory invoices={invoices} vendorSettings={vendorSettings} />
        </div>
      </div>
    </div>
  );
}
