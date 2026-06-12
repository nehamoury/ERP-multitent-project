export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
      <p className="text-xl text-muted-foreground mb-12">Start your 14-day free trial today. No credit card required.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto text-left">
        {[
          {
            name: "FREE",
            price: "₹0",
            yearlyPrice: "₹0 billed yearly",
            employees: "Up to 5 EMPLOYEES",
            features: ["Attendance", "Basic Reports"]
          },
          {
            name: "STARTER",
            price: "₹999",
            yearlyPrice: "₹9990 billed yearly",
            employees: "Up to 20 EMPLOYEES",
            features: ["Attendance", "Leave Management", "Basic Reports", "QR Scanner"]
          },
          {
            name: "PRO",
            price: "₹2999",
            yearlyPrice: "₹29990 billed yearly",
            employees: "Up to 100 EMPLOYEES",
            features: ["Attendance", "Leave Management", "Advanced Reports", "QR Scanner", "Payroll", "Projects"]
          },
          {
            name: "ENTERPRISE",
            price: "₹9999",
            yearlyPrice: "₹99990 billed yearly",
            employees: "Up to 1000 EMPLOYEES",
            features: ["Attendance", "Leave Management", "Advanced Reports", "QR Scanner", "Payroll", "Projects", "API Access", "Custom Domain", "Dedicated Support"]
          }
        ].map((plan) => (
          <div key={plan.name} className="border rounded-2xl p-6 bg-card shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-bold uppercase">{plan.name}</h3>
            <div className="my-4">
              <span className="text-3xl font-bold">{plan.price}</span><span className="text-muted-foreground">/mo</span>
              <p className="text-xs text-muted-foreground mt-1">{plan.yearlyPrice}</p>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium mb-6 flex items-center justify-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {plan.employees}
            </div>
            <div className="mb-4 text-xs font-bold text-muted-foreground tracking-wider uppercase">Features</div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="/start-free-trial" className="block w-full py-2.5 text-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors mt-auto">Start Free Trial</a>
          </div>
        ))}
      </div>
    </div>
  );
}
