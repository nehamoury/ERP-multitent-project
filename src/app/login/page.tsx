// src/app/(auth)/login/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await getAuth();
  if (session?.user) redirect(getDashboardPath(session.user.role));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="text-white font-display font-bold text-xl">AttendIQ</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Smart Attendance<br />Management System
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Track employee attendance, manage leaves, generate reports, and gain insights — all from one powerful dashboard.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: "✅", text: "Real-time check-in/check-out tracking" },
              { icon: "📊", text: "Advanced analytics & monthly reports" },
              { icon: "🔐", text: "Role-based access control" },
              { icon: "📧", text: "Automated email notifications" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-blue-100">
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-blue-200 text-sm">
          © 2024 AttendIQ. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg">AttendIQ</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <div className="mt-8 p-4 bg-muted rounded-xl text-sm">
            <p className="font-semibold mb-2 text-foreground">Demo Credentials</p>
            <div className="space-y-1 text-muted-foreground">
              <p><span className="font-medium text-foreground">Admin:</span> admin@attendiq.com</p>
              <p><span className="font-medium text-foreground">HR:</span> hr@attendiq.com</p>
              <p><span className="font-medium text-foreground">Password:</span> password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
