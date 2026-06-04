// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping:", options.subject);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "AttendIQ <no-reply@attendiq.com>",
      ...options,
    });
  } catch (error) {
    console.error("Email send error:", error);
  }
}

export function checkInEmailTemplate(name: string, time: string, date: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 12px;">
    <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px;">✅ Check-in Confirmed</h1>
    </div>
    <div style="background: white; padding: 24px; border-radius: 8px;">
      <p style="font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Your attendance has been recorded successfully.</p>
      <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 4px 0 0; color: #1e40af;"><strong>Check-in Time:</strong> ${time}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Have a productive day!</p>
    </div>
  </div>`;
}

export function leaveApprovalTemplate(name: string, status: string, type: string, dates: string) {
  const color = status === "APPROVED" ? "#10b981" : "#ef4444";
  const emoji = status === "APPROVED" ? "✅" : "❌";
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 12px;">
    <div style="background: ${color}; color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px;">${emoji} Leave ${status === "APPROVED" ? "Approved" : "Rejected"}</h1>
    </div>
    <div style="background: white; padding: 24px; border-radius: 8px;">
      <p style="font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
      <p style="color: #6b7280;">Your leave request has been <strong>${status.toLowerCase()}</strong>.</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #374151;"><strong>Leave Type:</strong> ${type}</p>
        <p style="margin: 4px 0 0; color: #374151;"><strong>Duration:</strong> ${dates}</p>
      </div>
    </div>
  </div>`;
}
