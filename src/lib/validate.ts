import { NextResponse } from "next/server";
import { z } from "zod";

export function validate<T>(schema: z.ZodType<T>, data: unknown): { data?: T; error?: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(i => ({ field: i.path.join("."), message: i.message }));
    return { error: NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 }) };
  }
  return { data: result.data };
}

export const schemas = {
  attendance: z.object({
    action: z.enum(["checkin", "checkout", "auto"]).optional(),
    note: z.string().max(500).optional(),
  }),

  leave: z.object({
    type: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY", "EMERGENCY", "UNPAID"]),
    startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    reason: z.string().min(1).max(1000),
  }),

  leaveAction: z.object({
    action: z.enum(["approve", "reject"]),
    note: z.string().max(500).optional(),
  }),

  employee: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).optional(),
    departmentId: z.string().optional(),
    designationId: z.string().optional(),
    branchId: z.string().optional(),
    teamId: z.string().optional(),
    reportingManagerId: z.string().optional(),
    joinDate: z.string().optional(),
    shiftStart: z.string().optional(),
    shiftEnd: z.string().optional(),
  }),

  payroll: z.object({
    userId: z.string(),
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    basicSalary: z.number().min(0),
    allowances: z.number().min(0).optional(),
    deductions: z.number().min(0).optional(),
    notes: z.string().max(500).optional(),
  }),

  invoice: z.object({
    clientName: z.string().min(1).max(200),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().max(20).optional(),
    amount: z.number().min(0),
    gstAmount: z.number().min(0).optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(1000).optional(),
  }),

  project: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    managerId: z.string(),
    departmentId: z.string().optional(),
    teamId: z.string().optional(),
  }),

  task: z.object({
    projectId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
  }),

  ticket: z.object({
    subject: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),

  workReport: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().min(1).max(5000),
    hoursWorked: z.number().min(0).max(24),
  }),

  notice: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    type: z.enum(["INFO", "WARNING", "URGENT", "SUCCESS"]),
    expiresAt: z.string().optional(),
  }),

  payment: z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    notes: z.object({
      vendorId: z.string(),
      planId: z.string(),
      planName: z.string(),
      isYearly: z.string(),
      baseAmount: z.string(),
      gstAmount: z.string(),
    }),
  }),
};
