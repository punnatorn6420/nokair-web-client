import { NextResponse } from "next/server";
import { applyRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { validateSearchQuery } from "@/lib/security/validation";

const RATE_LIMIT = {
  limit: 5,
  windowMs: 10_000,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const key = `${ip}:GET:/api/mock-search`;
    const rateLimitResult = applyRateLimit(key, RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "too_many_requests",
          message: "Rate limit exceeded. Please retry later.",
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
            "X-RateLimit-Limit": String(RATE_LIMIT.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = validateSearchQuery(searchParams.get("q"));

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_input",
          message: validation.message,
        },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        },
      );
    }

    await sleep(180);

    const q = validation.q.toLowerCase();
    const results = [
      `${q} - demo result A`,
      `${q} - demo result B`,
      `${q} - demo result C`,
    ];

    return NextResponse.json(
      {
        ok: true,
        query: validation.q,
        results,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("[mock-search] unexpected error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: "Unexpected server error",
      },
      { status: 500 },
    );
  }
}
