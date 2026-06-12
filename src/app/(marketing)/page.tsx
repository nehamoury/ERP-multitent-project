import Link from "next/link";
import { Button } from "@/components/ui/shared";
import { getAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Building2, Users2, LineChart, FileText } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getAuth();
  
  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }
  
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-48 bg-gradient-to-b from-background to-muted/50">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="max-w-[800px] mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The Modern SaaS ERP for <span className="text-primary">Growing Teams</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Streamline your HR, Payroll, Attendance, and Invoicing in one unified platform. Designed for multi-branch organizations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/start-free-trial" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8">
                      Start 14-Day Free Trial
                    </Button>
                  </Link>
                  <Link href="#features" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                      Explore Features
                    </Button>
                  </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full py-20 md:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run your business</h2>
            <p className="mt-4 text-lg text-muted-foreground">Comprehensive modules that work together seamlessly.</p>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Attendance & Leaves", icon: Users2, desc: "Real-time tracking, QR check-ins, and automated leave management with approvals." },
              { title: "Payroll Management", icon: Building2, desc: "Automated salary processing with deductions, allowances, and dynamic payslips." },
              { title: "Client Invoicing", icon: FileText, desc: "Generate GST-ready invoices, track payments, and manage client billing easily." },
              { title: "Multi-Branch Support", icon: Building2, desc: "Manage multiple locations, departments, and teams with strict data isolation." },
              { title: "Task Management", icon: CheckCircle2, desc: "Assign tasks, track progress, and monitor project health in real-time." },
              { title: "Analytics & Reports", icon: LineChart, desc: "Exportable reports for attendance, payroll, and work logs for data-driven decisions." },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col gap-3 items-center text-center p-6 rounded-2xl bg-muted/30 border">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Ready to transform your workplace?</h2>
          <p className="mx-auto max-w-[600px] text-lg md:text-xl opacity-90">
            Join thousands of companies using AttendIQ to automate their daily operations.
          </p>
          <Link href="/start-free-trial">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
