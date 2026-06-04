"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shared";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface BillingSettingsProps {
  initialSettings: {
    billingAddress: string | null;
    state: string | null;
    gstin: string | null;
  };
}

export function BillingSettings({ initialSettings }: BillingSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    billingAddress: initialSettings?.billingAddress || "",
    state: initialSettings?.state || "",
    gstin: initialSettings?.gstin || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/billing/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Billing settings saved successfully!");
      } else {
        toast.error("Failed to save billing settings.");
      }
    } catch (e) {
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-lg">Billing & GST Settings</h3>
        <p className="text-sm text-muted-foreground">This information will appear on your invoices.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <label className="text-sm font-medium">Billing Address (Company)</label>
          <input 
            className={inputClassName}
            placeholder="e.g. 123 Tech Park, Floor 4"
            value={formData.billingAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, billingAddress: e.target.value })}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">State / Province</label>
            <input 
              className={inputClassName}
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">GSTIN (Optional)</label>
            <input 
              className={inputClassName}
              placeholder="e.g. 27AADCB2230M1Z2"
              value={formData.gstin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, gstin: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Leave blank if unregistered.</p>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}
