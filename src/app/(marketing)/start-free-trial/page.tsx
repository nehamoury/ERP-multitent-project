"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardHeader, Button } from "@/components/ui/shared";

export default function StartFreeTrialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/auth/register-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to start free trial");
      }

      // Auto login
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: data.companyEmail as string,
        password: data.password as string,
      });

      if (signInRes?.error) {
        throw new Error("Account created but failed to auto-login. Please login manually.");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex h-full min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader
          title="Start Your Free Trial"
          description="Get full access to all AttendIQ ERP features for 14 days. No credit card required."
        />
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium leading-none">Company Name</label>
                <input id="companyName" name="companyName" required placeholder="Acme Corp" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="ownerName" className="text-sm font-medium leading-none">Your Name</label>
                <input id="ownerName" name="ownerName" required placeholder="John Doe" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="companyEmail" className="text-sm font-medium leading-none">Work Email</label>
              <input id="companyEmail" name="companyEmail" type="email" required placeholder="admin@acmecorp.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="mobileNumber" className="text-sm font-medium leading-none">Mobile Number</label>
                <input id="mobileNumber" name="mobileNumber" type="tel" required placeholder="+1 234 567 890" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium leading-none">Country</label>
                <input id="country" name="country" required placeholder="United States" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>

            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full justify-center h-12 text-lg" disabled={loading}>
              {loading ? "Setting up your workspace..." : "Create My Account"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
