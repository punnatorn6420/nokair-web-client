import { cookies, headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MOCK_SESSION_COOKIE } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

type MockSearchResponse = {
  ok: boolean;
  query?: string;
  results?: string[];
  error?: string;
  message?: string;
};

async function fetchMockSearch(host: string): Promise<MockSearchResponse> {
  const response = await fetch(`${host}/api/mock-search?q=ssr-demo`, {
    cache: "no-store",
  });
  return response.json();
}

export default async function SSRCheckPage() {
  const requestId = crypto.randomUUID();
  const renderedAt = new Date().toISOString();

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const origin = `${protocol}://${host}`;

  const searchData = await fetchMockSearch(origin);
  const cookieStore = await cookies();
  const session = cookieStore.get(MOCK_SESSION_COOKIE)?.value;

  console.log("[SSR_CHECK_RENDER]", {
    requestId,
    renderedAt,
    hasSession: Boolean(session),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-zinc-50 p-6 text-zinc-900">
      <Card>
        <CardHeader>
          <CardTitle>SSR Proof Page (/ssr-check)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Server Rendered At:</span> {renderedAt}
          </p>
          <p>
            <span className="font-semibold">Request ID:</span> {requestId}
          </p>
          <p>
            <span className="font-semibold">Mock Session:</span>{" "}
            {session ? "Logged in (HttpOnly cookie exists)" : "Not logged in"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Server-side fetch result (from /api/mock-search)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-zinc-100">
            {JSON.stringify(searchData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mock Auth Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action="/api/auth/mock-login" method="post">
            <input type="hidden" name="username" value="demo-user" />
            <Button type="submit">Mock Login (set HttpOnly cookie)</Button>
          </form>
          <form action="/api/auth/mock-logout" method="post">
            <Button type="submit" variant="outline">
              Mock Logout (clear cookie)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>How to verify SSR is real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1) Refresh and watch terminal log line: [SSR_CHECK_RENDER].</p>
          <p>2) View Page Source and confirm Server Rendered At / Request ID exists in HTML.</p>
          <p>3) Disable JavaScript and reload. Content should still appear.</p>
          <p>4) In Network tab, inspect document response HTML for rendered values.</p>
        </CardContent>
      </Card>
    </main>
  );
}
