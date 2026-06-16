// src/app/(auth)/login/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await getAuth();
  if (session?.user) redirect(getDashboardPath(session.user.role));

  const enableDemoLogin = process.env.ENABLE_DEMO_LOGIN === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg">AttendIQ</span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-display font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          {enableDemoLogin && (
            <div className="mt-8 p-4 bg-muted rounded-xl text-sm">
              <p className="font-semibold mb-2 text-foreground">Demo Credentials</p>
              <div className="space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Admin:</span> admin@attendiq.com</p>
                <p><span className="font-medium text-foreground">HR:</span> hr@attendiq.com</p>
                <p><span className="font-medium text-foreground">Password:</span> password123</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground space-y-4">
            <p>
              Don't have an account?{' '}
              <Link href="/pricing" className="text-primary font-semibold hover:underline">
                Start Free Trial
              </Link>
            </p>
            <p>
              <Link href="/" className="hover:text-foreground transition-colors">
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
    </div>
  );
}
