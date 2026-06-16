import Link from "next/link";
import { Button } from "@/components/ui/shared";
import { getAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Building2, Users2, LineChart, FileText, Zap, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getAuth();

  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full pt-10 pb-10 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/4 mix-blend-multiply dark:mix-blend-lighten"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl opacity-50 -translate-x-1/2 translate-y-1/4 mix-blend-multiply dark:mix-blend-lighten"></div>

        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <div className="max-w-[850px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide border border-primary/20 backdrop-blur-sm mx-auto">
              <Zap size={14} className="fill-primary" /> The Future of Work is Here
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-balance leading-[1.1]">
              The Modern SaaS ERP for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Growing Teams</span>
            </h1>

            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl lg:text-2xl font-medium text-balance">
              Streamline your HR, Payroll, Attendance, and Invoicing in one unified platform. Designed exclusively for modern multi-branch organizations.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link href="/start-free-trial" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-300">
                  Start 14-Day Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl backdrop-blur-sm bg-background/50 hover:bg-muted transition-colors duration-300 border-2">
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> No credit card required</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full py-24 md:py-32 bg-muted/30 border-y border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">Everything you need to run your business</h2>
            <p className="text-lg text-muted-foreground">Say goodbye to scattered tools. Our comprehensive modules work together seamlessly to save you hours every week.</p>
          </div>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Attendance & Leaves", icon: Users2, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Real-time tracking, QR check-ins, and automated leave management with instant manager approvals." },
              { title: "Payroll Management", icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Automated salary processing with custom deductions, tax allowances, and dynamic payslip generation." },
              { title: "Client Invoicing", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Generate GST-ready professional invoices, track payments, and manage client billing effortlessly." },
              { title: "Multi-Branch Support", icon: Building2, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Manage multiple locations, departments, and teams with strict data isolation and role-based access." },
              { title: "Task Management", icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-500/10", desc: "Assign critical tasks, track employee progress, and monitor project health in real-time from anywhere." },
              { title: "Analytics & Reports", icon: LineChart, color: "text-cyan-500", bg: "bg-cyan-500/10", desc: "Exportable detailed reports for attendance trends, payroll expenses, and work logs for data-driven decisions." },
            ].map((feature, i) => (
              <div key={i} className="group flex flex-col items-start text-left p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`h-16 w-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 md:py-32 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] overflow-hidden bg-primary text-primary-foreground py-20 px-6 md:px-12 text-center shadow-2xl">
            {/* Abstract Background patterns for CTA */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-balance leading-tight">
                Ready to transform your workplace?
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/90 font-medium max-w-2xl mx-auto">
                Join thousands of forward-thinking companies using AttendIQ to automate their daily operations and focus on growth.
              </p>
              <div className="pt-6 flex justify-center">
                <Link href="/start-free-trial">
                  <Button size="lg" variant="secondary" className="h-16 px-10 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 text-primary w-full sm:w-auto">
                    Get Started for Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
