"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, ChevronRight, Building, User, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface BuyPlanClientProps {
  plans: any[];
}

export default function BuyPlanClient({ plans }: BuyPlanClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPlan = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  
  useEffect(() => {
    if (initialPlan) {
      const plan = plans.find(p => p.name.toLowerCase() === initialPlan.toLowerCase());
      if (plan) setSelectedPlanId(plan.id);
    } else if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [initialPlan, plans]);

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    companySize: "1-10",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    gstNumber: "",
    address: "",
    state: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedPlanId) return toast.error("Select a plan first");
    
    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          companyDetails: formData,
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Load Razorpay Script
      const res = await loadRazorpay();
      if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

      // 3. Configure Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: orderData.amount * 100,
        currency: "INR",
        name: "AttendIQ",
        description: `${selectedPlan?.name} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            toast.loading("Verifying payment...", { id: "payment" });
            const verifyRes = await fetch("/api/subscription/register-paid", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                sessionId: orderData.sessionId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            
            toast.success("Payment successful! Redirecting to login...", { id: "payment" });
            setTimeout(() => router.push("/login"), 2000);
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed", { id: "payment" });
          }
        },
        prefill: {
          name: formData.adminName,
          email: formData.adminEmail,
          contact: formData.adminPhone,
        },
        theme: { color: "#3b82f6" },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      paymentObject.open();

    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
      <div className="flex border-b border-border">
        {[
          { num: 1, title: "Plan", icon: Check },
          { num: 2, title: "Company", icon: Building },
          { num: 3, title: "Admin", icon: User },
          { num: 4, title: "Billing", icon: CreditCard },
        ].map((s) => (
          <div key={s.num} className={`flex-1 flex flex-col items-center justify-center p-4 border-r border-border last:border-r-0 ${step === s.num ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">Select a Plan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${selectedPlanId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <h3 className="text-xl font-bold uppercase">{p.name}</h3>
                  <div className="my-4">
                    <span className="text-3xl font-bold">₹{p.priceMonthly}</span><span className="text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {(p.features as string[])?.map((f: string) => (
                      <li key={f} className="text-sm flex items-center gap-2"><Check size={14} className="text-emerald-500" /> {f}</li>
                    ))}
                  </ul>
                  <div className="w-full text-center py-2 rounded-lg bg-muted text-sm font-semibold">
                    {selectedPlanId === p.id ? "Selected" : "Select"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={handleNext} disabled={!selectedPlanId} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-6">Company Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Company Name *</label>
                <input required name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Industry *</label>
                  <select name="industry" value={formData.industry} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    <option value="IT">IT & Software</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Company Size *</label>
                  <select name="companySize" value={formData.companySize} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="1-10">1 - 10</option>
                    <option value="11-50">11 - 50</option>
                    <option value="51-200">51 - 200</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} className="px-6 py-2.5 text-muted-foreground hover:bg-muted rounded-lg font-medium">Back</button>
              <button onClick={handleNext} disabled={!formData.companyName || !formData.industry} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-6">Admin User Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <input required name="adminName" value={formData.adminName} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Work Email *</label>
                <input required type="email" name="adminEmail" value={formData.adminEmail} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="john@acme.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mobile Number *</label>
                <input required name="adminPhone" value={formData.adminPhone} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password *</label>
                <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••••" />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} className="px-6 py-2.5 text-muted-foreground hover:bg-muted rounded-lg font-medium">Back</button>
              <button onClick={handleNext} disabled={!formData.adminName || !formData.adminEmail || !formData.adminPassword} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50">
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-6">Billing Details</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                <span>Plan:</span>
                <span className="font-medium text-foreground">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-4 text-muted-foreground">
                <span>Monthly Price:</span>
                <span className="font-medium text-foreground">₹{selectedPlan?.priceMonthly}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Total to Pay:</span>
                <span>₹{selectedPlan?.priceMonthly}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">GST Number (Optional)</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Billing Address</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="123 Business Avenue" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">State</label>
                <input name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Maharashtra" />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handleBack} disabled={loading} className="px-6 py-2.5 text-muted-foreground hover:bg-muted rounded-lg font-medium">Back</button>
              <button onClick={handlePayment} disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Pay via Razorpay"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
