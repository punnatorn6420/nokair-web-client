"use client";

import { createContext, useContext, useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Messages = Record<string, any>;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = ctx!.messages;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur == null) return (fallback as T) ?? (path as unknown as T);
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
