// src/lib/locales.client.ts
export type Locale = "th" | "en";
export const LOCALE_COOKIE = "APP_LOCALE";
export const DEFAULT_LOCALE: Locale = "th";

export function normalizeLocale(input?: string | null): Locale {
  const v = (input || "").toLowerCase();
  return v.includes("th") ? "th" : "en";
}

export function getClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;

  const m = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  const v = m ? decodeURIComponent(m[1]) : null;
  if (v === "th" || v === "en") return v;

  return normalizeLocale(navigator.language);
}
