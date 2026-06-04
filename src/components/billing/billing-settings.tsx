"use client";

import { useState } from "react";
import { Button } from "@/components/ui/shared";
import { Loader2, Save, Edit2, MapPin, Building, Receipt } from "lucide-react";
import toast from "react-hot-toast";

interface BillingSettingsProps {
  initialSettings: {
    billingAddress: string | null;
    state: string | null;
    gstin: string | null;
  };
}

export function BillingSettings({ initialSettings }: BillingSettingsProps) {
  const [isEditing, setIsEditing] = useState(
    !initialSettings.billingAddress || !initialSettings.state
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    billingAddress: initialSettings?.billingAddress || "",
    state: initialSettings?.state || "",
    gstin: initialSettings?.gstin || "",
  });

  const [savedData, setSavedData] = useState({
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
        setSavedData(formData);
        setIsEditing(false);
      } else {
        toast.error("Failed to save billing settings.");
      }
    } catch (e) {
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Billing & GST Details
          </h3>
          <p className="text-sm text-muted-foreground">This information will appear on your invoices.</p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 size={14} className="mr-2" /> Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6 bg-muted/30 rounded-lg p-5 border border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-1">
              <MapPin size={14} /> Billing Address
            </div>
            <p className="text-sm font-medium">{savedData.billingAddress || "Not provided"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-1">
                <Building size={14} /> State / Province
              </div>
              <p className="text-sm font-medium">{savedData.state || "Not provided"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-1">
                <Receipt size={14} /> GSTIN
              </div>
              <p className="text-sm font-medium">
                {savedData.gstin ? (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold tracking-wider">
                    {savedData.gstin}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Unregistered</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-muted/20 p-5 rounded-lg border border-border/50">
          <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">State / Province</label>
              <input 
                className={inputClassName}
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Save Settings
            </Button>
            {savedData.billingAddress && (
              <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false);
                setFormData(savedData);
              }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
