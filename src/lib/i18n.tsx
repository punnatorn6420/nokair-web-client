"use client";

import { createContext, useContext, useMemo } from "react";

type Messages = Record<string, unknown>;
type Ctx = { locale: "th" | "en"; messages: Messages };

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: "th" | "en";
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT(ns?: string) {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider is missing");

  function get<T = string>(path: string, fallback?: T) {
    const parts = (ns ? `${ns}.${path}` : path).split(".");
    let cur: unknown = ctx!.messages;
    for (const p of parts) {
      if (typeof cur === "object" && cur !== null && p in cur) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return (fallback as T) ?? (path as unknown as T);
      }
    }
    return cur as T;
  }

  return get as <T = string>(path: string, fallback?: T) => T;
}

export function useLocale() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider is missing");
  return ctx.locale;
}
