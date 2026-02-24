import { NextResponse } from "next/server";
import { MOCK_SESSION_COOKIE } from "@/lib/security/auth";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    message: "Mock logout success",
  });

  response.cookies.set({
    name: MOCK_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
