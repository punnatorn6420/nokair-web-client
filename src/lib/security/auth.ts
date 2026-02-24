export const MOCK_SESSION_COOKIE = "mock_session";

export function createMockSessionValue(username: string) {
  const safeName = username.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "demo-user";
  const nonce = crypto.randomUUID();
  return `${safeName}.${nonce}`;
}
