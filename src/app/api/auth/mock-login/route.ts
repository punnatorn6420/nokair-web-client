import { NextResponse } from "next/server";
import { MOCK_SESSION_COOKIE, createMockSessionValue } from "@/lib/security/auth";

const SESSION_TTL_SECONDS = 60 * 30;

async function resolveUsername(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json().catch(() => ({}))) as { username?: string };
    return typeof payload.username === "string" ? payload.username : "demo-user";
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const username = form.get("username");
    return typeof username === "string" ? username : "demo-user";
  }

  return "demo-user";
}

export async function POST(request: Request) {
  try {
    const username = await resolveUsername(request);

    const response = NextResponse.json({
      ok: true,
      message: "Mock login success",
    });

    response.cookies.set({
      name: MOCK_SESSION_COOKIE,
      value: createMockSessionValue(username),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[mock-login] unexpected error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: "Unable to process login",
      },
      { status: 500 },
    );
  }
}
