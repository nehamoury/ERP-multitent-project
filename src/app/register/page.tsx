"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Mail, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          adminName: formData.adminName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register. Please try again.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white p-4">
        <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to AttendIQ!</h2>
          <p className="text-blue-200/70 mb-6">
            Your company has been successfully registered. You are being redirected to the login page...
          </p>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10">
        
        {/* Left Side - Info */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-primary/10 to-transparent">
          <div>
            <div className="flex items-center gap-2 text-primary font-display font-bold text-2xl mb-8">
              <Building2 size={28} />
              AttendIQ
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Streamline your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Workforce Management
              </span>
            </h1>
            <p className="text-blue-200/70 text-lg leading-relaxed mb-8">
              Start your 14-day free trial today. Manage attendance, leaves, payroll, and more from one unified platform.
            </p>

            <div className="space-y-4">
              {[
                "No credit card required",
                "Setup in less than 2 minutes",
                "Full access to PRO features during trial"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-200/80">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-sm text-blue-200/50">
            © {new Date().getFullYear()} AttendIQ. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 lg:p-16 bg-[#111827]">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold font-display">Create your account</h2>
              <p className="text-blue-200/70 text-sm mt-2">Get started with your free 14-day trial</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                  <input
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Admin Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                    <input
                      name="adminName"
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={handleChange}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Work Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                    placeholder="john@acmecorp.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-200/70 uppercase tracking-wider">Confirm</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder:text-blue-200/30"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-blue-200/70">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium hover:underline transition-all">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick hack for the Check icon since I forgot to import it in the top imports
function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
