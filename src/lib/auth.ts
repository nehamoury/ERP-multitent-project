// src/lib/auth.ts
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            vendorId: true,
            employeeId: true,
            branchId: true,
            name: true,
            email: true,
            password: true,
            role: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            profileImage: true,
            isActive: true,
            vendor: {
              select: {
                status: true,
                subscription: {
                  select: { status: true, plan: true }
                }
              }
            }
          },
        });

        if (!user) throw new Error("No account found with this email");
        if (!user.isActive) throw new Error("Account is deactivated. Contact HR.");
        if (user.vendor?.status === "SUSPENDED") {
          throw new Error("Your company account has been suspended.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            vendorId: user.vendorId,
            action: "LOGIN",
            description: `${user.name} logged in`,
          },
        }).catch(() => {});

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            vendorId: user.vendorId,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            description: `User ${user.name} logged in`,
          },
        }).catch(() => {});

        return {
          id: user.id,
          vendorId: user.vendorId,
          employeeId: user.employeeId,
          branchId: user.branchId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department?.name ?? "",
          designation: user.designation?.name ?? "",
          image: user.profileImage ?? undefined,
          subscription: user.vendor?.subscription ? {
            status: user.vendor.subscription.status,
            planName: user.vendor.subscription.plan.name,
            features: (user.vendor.subscription.plan.features as string[]),
            maxEmployees: user.vendor.subscription.plan.maxEmployees,
            maxBranches: user.vendor.subscription.plan.maxBranches,
            maxStorageMB: user.vendor.subscription.plan.maxStorageMB,
          } : null
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.vendorId = user.vendorId;
        token.employeeId = user.employeeId;
        token.branchId = user.branchId;
        token.role = user.role;
        token.department = user.department;
        token.designation = user.designation;
        token.subscription = user.subscription;
        token.originalRole = user.role;
        token.originalVendorId = user.vendorId;
      }
      
      // Handle Impersonation
      if (trigger === "update" && (session?.impersonateUserId || session?.impersonateVendorId)) {
        if (token.originalRole === "SUPER_ADMIN" || token.isImpersonating) {
          const targetUserId = session.impersonateUserId || session.impersonateVendorId; // fallback or specific
          const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
              department: { select: { name: true } },
              designation: { select: { name: true } },
              vendor: {
                include: {
                  subscription: {
                    include: { plan: true }
                  }
                }
              }
            }
          });
          if (targetUser) {
            token.originalUserId = token.originalUserId || token.id;
            token.originalVendorId = token.originalVendorId || token.vendorId;
            token.originalRole = token.originalRole || token.role;

            token.id = targetUser.id;
            token.vendorId = targetUser.vendorId;
            token.employeeId = targetUser.employeeId;
            token.branchId = targetUser.branchId;
            token.role = targetUser.role;
            token.department = targetUser.department?.name ?? "";
            token.designation = targetUser.designation?.name ?? "";
            token.isImpersonating = true;

            if (targetUser.vendor?.subscription) {
              token.subscription = {
                status: targetUser.vendor.subscription.status,
                planName: targetUser.vendor.subscription.plan.name,
                features: (targetUser.vendor.subscription.plan.features as string[]),
                maxEmployees: targetUser.vendor.subscription.plan.maxEmployees,
                maxBranches: targetUser.vendor.subscription.plan.maxBranches,
                maxStorageMB: targetUser.vendor.subscription.plan.maxStorageMB
              };
            } else {
              token.subscription = null;
            }
          }
        }
      }

      // Revert Impersonation
      if (trigger === "update" && session?.revertImpersonation) {
        if (token.originalRole === "SUPER_ADMIN") {
          token.id = token.originalUserId || token.id;
          token.vendorId = token.originalVendorId ?? "";
          token.branchId = null;
          token.role = "SUPER_ADMIN";
          token.isImpersonating = false;
          token.department = "";
          token.designation = "";
          token.employeeId = "";
          token.subscription = null;
        }
      }

      if (trigger === "update" && token.vendorId && !session?.impersonateVendorId && !session?.revertImpersonation) {
        const vendor = await prisma.vendor.findUnique({
          where: { id: token.vendorId },
          include: { subscription: { include: { plan: true } } }
        });
        if (vendor?.subscription) {
          token.subscription = {
            status: vendor.subscription.status,
            planName: vendor.subscription.plan.name,
            features: (vendor.subscription.plan.features as string[]),
            maxEmployees: vendor.subscription.plan.maxEmployees,
            maxBranches: vendor.subscription.plan.maxBranches,
            maxStorageMB: vendor.subscription.plan.maxStorageMB
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.vendorId = token.vendorId;
        session.user.employeeId = token.employeeId;
        session.user.branchId = token.branchId;
        session.user.role = token.role;
        session.user.department = token.department ?? "";
        session.user.designation = token.designation ?? "";
        session.user.subscription = token.subscription;
        session.user.isImpersonating = token.isImpersonating;
        session.user.originalRole = token.originalRole;
      }
      return session;
    },
  },
};

export const getAuth = () => getServerSession(authOptions);

export async function requireAuth(requiredRoles?: string[]) {
  const session = await getAuth();
  if (!session?.user) return null;
  if (requiredRoles && !requiredRoles.includes(session.user.role as string)) return null;
  return session;
}
