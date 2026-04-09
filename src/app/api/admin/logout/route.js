import { NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(adminSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

