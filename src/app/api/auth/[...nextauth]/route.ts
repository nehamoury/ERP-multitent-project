// src/app/api/auth/[...nextauth]/route.ts
import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: any) {
  return handler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const result = rateLimit(ip, 10, 15 * 60 * 1000);

  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "Too many login attempts. Try again later." }), {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
    });
  }

  return handler(req, context);
}
