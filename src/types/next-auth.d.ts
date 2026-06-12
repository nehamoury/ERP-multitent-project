// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

interface SubscriptionInfo {
  status: string;
  planName: string;
  features: string[];
  maxEmployees: number;
  maxBranches: number;
  maxStorageMB: number;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      vendorId: string;
      employeeId: string;
      name: string;
      email: string;
      role: string;
      department: string;
      designation: string;
      branchId: string | null;
      image?: string;
      subscription?: SubscriptionInfo | null;
      isImpersonating?: boolean;
      originalRole?: string;
    };
  }

  interface User {
    id: string;
    vendorId: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
    designation: string;
    branchId: string | null;
    image?: string;
    subscription?: SubscriptionInfo | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    vendorId: string;
    employeeId: string;
    role: string;
    department: string;
    designation: string;
    branchId: string | null;
    subscription?: SubscriptionInfo | null;
    isImpersonating?: boolean;
    originalRole?: string;
    originalUserId?: string;
    originalVendorId?: string;
  }
}
