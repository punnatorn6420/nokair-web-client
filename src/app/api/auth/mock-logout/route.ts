import { NextResponse } from "next/server";
import { MOCK_SESSION_COOKIE } from "@/lib/security/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/ssr-check";

  const response = NextResponse.redirect(new URL(redirectTo, url.origin), 303);

  response.cookies.set({
    name: MOCK_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // clear cookie
  });

  return response;
}
