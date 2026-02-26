import { cookies, headers } from "next/headers";

export type Locale = "th" | "en";
export const LOCALE_COOKIE = "APP_LOCALE";
export const DEFAULT_LOCALE: Locale = "th";

export function normalizeLocale(input?: string | null): Locale {
  const v = (input || "").toLowerCase();
  return v.includes("th") ? "th" : "en";
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "th" || cookieLocale === "en") return cookieLocale;

  const headerStore = await headers();
  return normalizeLocale(headerStore.get("accept-language"));
}
