"use client";

import { useState } from "react";
import { Settings, Save, Server, Mail, CreditCard } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui/shared";

export default function SettingsClient() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            System Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage global configuration for the AttendiQ platform
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-8">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="Platform Configuration" description="Global settings applied across all vendors." />
          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name</label>
                <input defaultValue="AttendiQ Workforce CRM" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Support Email</label>
                <input defaultValue="support@attendiq.com" type="email" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Maintenance Mode</label>
                <p className="text-sm text-muted-foreground">
                  Prevent users from logging in during system updates.
                </p>
              </div>
              <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Sign-up Enabled</label>
                <p className="text-sm text-muted-foreground">
                  Allow new vendors to sign up automatically.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
            </div>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="SMTP Configuration" description="Configure outgoing email server for platform notifications." />
          <div className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Host</label>
                <input defaultValue="smtp.sendgrid.net" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Port</label>
                <input defaultValue="587" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Username</label>
                <input defaultValue="apikey" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Password</label>
                <input type="password" defaultValue="*************************" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">From Address</label>
                <input defaultValue="noreply@attendiq.com" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="Payment Gateway" description="Configure Razorpay/Stripe keys for handling subscriptions." />
          <div className="p-6 space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Razorpay Key ID</label>
                <input type="password" defaultValue="rzp_test_*********" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Razorpay Key Secret</label>
                <input type="password" defaultValue="*******************" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Test Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Use test keys instead of live keys for billing.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
