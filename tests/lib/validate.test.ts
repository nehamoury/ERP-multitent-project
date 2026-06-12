import { describe, it, expect } from "vitest";
import { validate, schemas } from "@/lib/validate";

describe("validate.leave", () => {
  it("passes for valid leave request", () => {
    const { data, error } = validate(schemas.leave, {
      type: "ANNUAL",
      startDate: "2024-02-01",
      endDate: "2024-02-03",
      reason: "Vacation",
    });
    expect(error).toBeUndefined();
    expect(data?.type).toBe("ANNUAL");
  });

  it("rejects invalid leave type", () => {
    const { error } = validate(schemas.leave, {
      type: "INVALID",
      startDate: "2024-02-01",
      endDate: "2024-02-03",
      reason: "Vacation",
    });
    expect(error).toBeDefined();
  });

  it("rejects empty reason", () => {
    const { error } = validate(schemas.leave, {
      type: "SICK",
      startDate: "2024-02-01",
      endDate: "2024-02-01",
      reason: "",
    });
    expect(error).toBeDefined();
  });
});

describe("validate.employee", () => {
  it("passes for valid employee data", () => {
    const { data, error } = validate(schemas.employee, {
      name: "John Doe",
      email: "john@example.com",
    });
    expect(error).toBeUndefined();
    expect(data?.name).toBe("John Doe");
  });

  it("rejects missing name", () => {
    const { error } = validate(schemas.employee, {
      email: "john@example.com",
    });
    expect(error).toBeDefined();
  });

  it("rejects invalid email", () => {
    const { error } = validate(schemas.employee, {
      name: "John",
      email: "not-an-email",
    });
    expect(error).toBeDefined();
  });

  it("rejects invalid role", () => {
    const { error } = validate(schemas.employee, {
      name: "John",
      email: "john@example.com",
      role: "CEO",
    });
    expect(error).toBeDefined();
  });
});

describe("validate.payment", () => {
  it("passes for valid payment data", () => {
    const { data, error } = validate(schemas.payment, {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "sig_123",
      notes: {
        vendorId: "v1",
        planId: "p1",
        planName: "PRO",
        isYearly: "false",
        baseAmount: "2999",
        gstAmount: "539.82",
      },
    });
    expect(error).toBeUndefined();
    expect(data?.razorpay_order_id).toBe("order_123");
  });

  it("rejects missing notes", () => {
    const { error } = validate(schemas.payment, {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "sig_123",
    });
    expect(error).toBeDefined();
  });
});
