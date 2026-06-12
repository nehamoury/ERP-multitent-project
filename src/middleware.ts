// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    // Role-based route guards
    const getDashboard = (r: string) => r === "SUPER_ADMIN" ? "/super-admin" : r === "ADMIN" ? "/admin" : r === "HR" ? "/hr" : r === "BRANCH_MANAGER" ? "/branch-manager" : "/employee";

    if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }
    if (pathname.startsWith("/hr") && !["ADMIN", "HR"].includes(role)) {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }
    if (pathname.startsWith("/branch-manager") && role !== "BRANCH_MANAGER") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }
    if (pathname.startsWith("/employee") && role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }

    const subStatus = token.subscription?.status;
    const vendorFeatures = token.subscription?.features ?? [];
    
    if (subStatus === "EXPIRED" || subStatus === "PAST_DUE" || subStatus === "CANCELLED") {
      // If it's an API route and not a GET request, block it, EXCEPT for billing/payment routes
      if (pathname.startsWith("/api") && req.method !== "GET") {
        const isBillingRoute = pathname.startsWith("/api/billing") || 
                               pathname.startsWith("/api/subscription") || 
                               pathname.startsWith("/api/payment");
        if (!isBillingRoute) {
          return NextResponse.json({ error: "Subscription inactive. Read-only mode enabled." }, { status: 403 });
        }
      }
    }

    // Feature locking logic for new modules
    if (pathname.startsWith("/api/payroll") && !vendorFeatures.includes("Payroll")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Payroll." }, { status: 403 });
    }
    if (pathname.startsWith("/api/invoices") && !vendorFeatures.includes("Invoices")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Invoices." }, { status: 403 });
    }
    if (pathname.startsWith("/api/work-reports") && !vendorFeatures.includes("Work Reports")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Work Reports." }, { status: 403 });
    }
    if (pathname.startsWith("/api/leaves") && !vendorFeatures.includes("Leave Management")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Leave Management." }, { status: 403 });
    }
    if (pathname.startsWith("/api/projects") && !vendorFeatures.includes("Projects")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Projects & Tasks." }, { status: 403 });
    }
    if (pathname.startsWith("/api/qr") && !vendorFeatures.includes("QR Scanner")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock QR Scanner." }, { status: 403 });
    }
    if (pathname.startsWith("/api/reports") && !vendorFeatures.includes("Basic Reports") && !vendorFeatures.includes("Advanced Reports")) {
      return NextResponse.json({ error: "Upgrade your plan to unlock Reports." }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/admin/:path*",
    "/hr/:path*",
    "/branch-manager/:path*",
    "/employee/:path*",
    "/api/employees/:path*",
    "/api/attendance/:path*",
    "/api/leaves/:path*",
    "/api/reports/:path*",
    "/api/audit-logs/:path*",
    "/api/qr/:path*",
    "/api/payroll/:path*",
    "/api/invoices/:path*",
    "/api/work-reports/:path*",
    "/api/permissions/:path*",
  ],
};
