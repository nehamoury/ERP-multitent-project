// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

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
      image?: string;
      subscription?: {
        status: string;
        planName: string;
        features: any;
        maxEmployees: number;
      } | null;
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
    image?: string;
    subscription?: any;
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
    subscription?: any;
  }
}
