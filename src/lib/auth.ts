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
        if ((user as any).vendor?.status === "SUSPENDED") {
          throw new Error("Your company account has been suspended.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        // Log login activity
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
          vendorId: (user as any).vendorId,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: (user as any).department?.name ?? "",
          designation: (user as any).designation?.name ?? "",
          image: user.profileImage || undefined,
          subscription: (user as any).vendor?.subscription ? {
            status: (user as any).vendor.subscription.status,
            planName: (user as any).vendor.subscription.plan.name,
            features: (user as any).vendor.subscription.plan.features,
            maxEmployees: (user as any).vendor.subscription.plan.maxEmployees
          } : null
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.vendorId = (user as any).vendorId;
        token.employeeId = (user as any).employeeId;
        token.role = (user as any).role;
        token.department = (user as any).department;
        token.designation = (user as any).designation;
        token.subscription = (user as any).subscription;
        token.originalRole = (user as any).role;
        token.originalVendorId = (user as any).vendorId;
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
            token.role = targetUser.role;
            token.department = targetUser.department?.name ?? "";
            token.designation = targetUser.designation?.name ?? "";
            token.isImpersonating = true;

            if (targetUser.vendor?.subscription) {
              token.subscription = {
                status: targetUser.vendor.subscription.status,
                planName: targetUser.vendor.subscription.plan.name,
                features: targetUser.vendor.subscription.plan.features,
                maxEmployees: targetUser.vendor.subscription.plan.maxEmployees
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
          token.id = (token.originalUserId as string) || token.id;
          token.vendorId = (token.originalVendorId as string) || "";
          token.role = "SUPER_ADMIN";
          token.isImpersonating = false;
          token.department = "";
          token.designation = "";
          token.employeeId = null as any;
          token.subscription = null;
        }
      }

      if (trigger === "update" && token.vendorId && !session?.impersonateVendorId && !session?.revertImpersonation) {
        const vendor = await prisma.vendor.findUnique({
          where: { id: token.vendorId as string },
          include: { subscription: { include: { plan: true } } }
        });
        if (vendor?.subscription) {
          token.subscription = {
            status: vendor.subscription.status,
            planName: vendor.subscription.plan.name,
            features: vendor.subscription.plan.features,
            maxEmployees: vendor.subscription.plan.maxEmployees
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.vendorId = token.vendorId as string;
        session.user.employeeId = token.employeeId as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        session.user.designation = token.designation as string;
        session.user.subscription = token.subscription as any;
        (session.user as any).isImpersonating = token.isImpersonating as boolean;
        (session.user as any).originalRole = token.originalRole as string;
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
